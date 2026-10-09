import os
import re
import json
import sys
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv()
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODELS_ENV = os.getenv("GROQ_MODELS", "qwen/qwen3.8-27b,openai/gpt-oss-120b")
GROQ_MODELS = [m.strip() for m in GROQ_MODELS_ENV.split(",") if m.strip()]
if "llama-3.3-70b-versatile" not in GROQ_MODELS:
    GROQ_MODELS.append("llama-3.3-70b-versatile")

def clean_json_string(text: str) -> str:
    """Extract clean JSON from LLM response containing markdown codeblocks."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def get_gemini_client() -> Optional[genai.Client]:
    """Initializes Google GenAI Client using GEMINI_API_KEY."""
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Gemini client initialization error: {e}")
        return None

def call_groq_chat(prompt: str, system_prompt: str = "", model_index: int = 0) -> Optional[str]:
    """Calls Groq API via standard OpenAI-compatible completions endpoint."""
    api_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not api_key:
        return None

    model = GROQ_MODELS[min(model_index, len(GROQ_MODELS) - 1)]
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"} if "JSON" in prompt.upper() else None
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"Groq API returned status {resp.status_code} with model {model}: {resp.text}")
                # Try next Groq model fallback if available
                if model_index + 1 < len(GROQ_MODELS):
                    return call_groq_chat(prompt, system_prompt, model_index + 1)
    except Exception as err:
        print(f"Groq call error with model {model}: {err}")
        if model_index + 1 < len(GROQ_MODELS):
            return call_groq_chat(prompt, system_prompt, model_index + 1)

    return None

def structure_medical_document(
    raw_ocr_text: str,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg"
) -> Dict[str, Any]:
    """
    Uses Gemini API or Groq to structure messy medical document text/image into verified JSON.
    Generates simple-language summaries in English, Telugu, Hindi, and Tamil.
    """
    client = get_gemini_client()
    target_gemini_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)

    prompt = f"""You are Aarogya AI, a clinical document intelligence copilot.
Analyze this medical document (Prescription, Lab Report, or Discharge Summary).
Extract the information into strict JSON following this exact schema:
{{
  "document_type": "Prescription" | "Lab Report" | "Discharge Summary" | "X-Ray / Imaging",
  "patient_name": "string",
  "visit_date": "string (e.g. 14 Sep 2024)",
  "doctor_name": "string",
  "facility_name": "string",
  "medicines": [
    {{
      "name": "string",
      "dosage": "string",
      "frequency": "string (e.g. 1 tab OD)",
      "duration": "string",
      "timing": "morning" | "afternoon" | "evening" | "night" | "multiple",
      "instructions": "string"
    }}
  ],
  "lab_values": [
    {{
      "test_name": "string",
      "value": "string",
      "unit": "string",
      "reference_range": "string",
      "status": "normal" | "low" | "high",
      "notes": "string"
    }}
  ],
  "ai_summary": {{
    "en": "Simple non-technical summary in English",
    "te": "Simple non-technical summary in Telugu",
    "hi": "Simple non-technical summary in Hindi",
    "ta": "Simple non-technical summary in Tamil"
  }},
  "review_alerts": [
    "Important clinical observations or values needing patient confirmation"
  ]
}}

Document OCR Text:
{raw_ocr_text if raw_ocr_text else "Extract directly from attached medical image or prescription."}
"""

    # 1. Attempt Gemini first
    if client:
        # Attempt target Gemini model (gemini-3.8-flash)
        candidate_gemini_models = [target_gemini_model]
        for g_model in candidate_gemini_models:
            try:
                contents = [prompt]
                if image_bytes:
                    contents.append(
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                    )

                response = client.models.generate_content(
                    model=g_model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                if response.text:
                    parsed = json.loads(clean_json_string(response.text))
                    print(f"Successfully processed medical document with Gemini model {g_model}")
                    return parsed
            except Exception as e:
                print(f"Gemini API attempt with {g_model} failed: {e}. Trying next option...")

    # 2. Attempt Groq fallback if OCR text is available
    if raw_ocr_text or not image_bytes:
        groq_resp = call_groq_chat(prompt=prompt)
        if groq_resp:
            try:
                parsed = json.loads(clean_json_string(groq_resp))
                print("Successfully processed medical document via Groq API.")
                return parsed
            except Exception as e:
                print(f"Failed to parse Groq JSON response: {e}")

    # 3. Clean neutral fallback if parsing could not extract structured entities
    return {
        "document_type": "Medical Document",
        "patient_name": "",
        "visit_date": "",
        "doctor_name": "",
        "facility_name": "",
        "medicines": [],
        "lab_values": [],
        "ai_summary": {
            "en": "Document processed. Please verify extracted fields or retake photo if text is unclear.",
            "te": "పత్రం ప్రాసెస్ చేయబడింది. దయచేసి వివరాలను సరిచూసుకోండి.",
            "hi": "दस्तावेज़ संसाधित किया गया। कृपया विवरण सत्यापित करें।",
            "ta": "ஆவணம் செயலாக்கப்பட்டது. தயவுசெய்து விவரங்களைச் சரிபார்க்கவும்."
        },
        "review_alerts": []
    }

def ask_aarogya_chat(
    query: str,
    language: str = "en",
    medical_history_context: str = ""
) -> Dict[str, Any]:
    """Handles multilingual conversational copilot queries using Gemini API and Groq."""
    emergency_keywords = ["chest pain", "heart attack", "cannot breathe", "severe bleeding", "unconscious"]
    is_emergency = any(kw in query.lower() for kw in emergency_keywords)

    if is_emergency:
        emergency_notices = {
            "en": "⚠️ URGENT CLINICAL NOTICE: Please seek emergency medical care immediately or call emergency services (108 / 112). Aarogya is an educational health copilot and does not replace emergency clinical attention.",
            "te": "⚠️ అత్యవసర వైద్య హెచ్చరిక: దయచేసి వెంటనే సమీపంలోని అత్యవసర వైద్య కేంద్రాన్ని సంప్రదించండి లేదా 108/112 కు కాల్ చేయండి.",
            "hi": "⚠️ आपातकालीन चिकित्सा सूचना: कृपया तुरंत आपातकालीन चिकित्सा सहायता लें या 108/112 पर कॉल करें।",
            "ta": "⚠️ அவசர மருத்துவ அறிவிப்பு: தயவுசெய்து உடனடியாக அவசர மருத்துவ உதவியை நாடுங்கள் (108 / 112)."
        }
        return {
            "response": emergency_notices.get(language, emergency_notices["en"]),
            "is_emergency": True,
            "citations": []
        }

    system_instruction = f"""You are Aarogya, an AI-powered personal health copilot.
User's Preferred Language: {language} (en=English, te=Telugu, hi=Hindi, ta=Tamil).
Respond strictly in {language}.
Patient History Context:
{medical_history_context}

Guidelines:
1. Explain medical terms in everyday simple language.
2. Ground all answers in the provided records and cite the report title and date.
3. If lab values are abnormal, mention reference ranges without making definitive diagnostic claims.
4. Never prescribe drugs or change dosages independently."""

    # 1. Attempt Gemini
    client = get_gemini_client()
    target_gemini_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    candidate_gemini_models = [target_gemini_model]

    if client:
        for g_model in candidate_gemini_models:
            try:
                response = client.models.generate_content(
                    model=g_model,
                    contents=query,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3
                    )
                )
                if response.text:
                    citations = []
                    if medical_history_context and medical_history_context.strip():
                        citations.append({"document_title": "Uploaded Medical Records", "document_date": "Recent"})
                    return {
                        "response": response.text,
                        "is_emergency": False,
                        "citations": citations
                    }
            except Exception as e:
                print(f"Gemini chat error with {g_model}: {e}")

    # 2. Attempt Groq fallback
    groq_resp = call_groq_chat(prompt=query, system_prompt=system_instruction)
    if groq_resp:
        citations = []
        if medical_history_context and medical_history_context.strip():
            citations.append({"document_title": "Uploaded Medical Records", "document_date": "Recent"})
        return {
            "response": groq_resp,
            "is_emergency": False,
            "citations": citations
        }

    # 3. Fallback response
    if medical_history_context and medical_history_context.strip():
        fallback_msg = f"Based on your uploaded records:\n{medical_history_context}\n\nPlease consult your doctor before changing any medications."
        citations = [{"document_title": "Uploaded Medical Records", "document_date": "Recent"}]
    else:
        fallback_msg = "I am your Aarogya health copilot. No medical records have been uploaded yet. Please scan or upload your prescription or lab test report, and I will summarize it and answer your health questions in simple language."
        citations = []

    return {
        "response": fallback_msg,
        "is_emergency": False,
        "citations": citations
    }

