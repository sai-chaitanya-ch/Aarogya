import os
import re
import json
import sys
import base64
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv

# Optional import of google-genai
try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None

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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODELS_ENV = os.getenv("GROQ_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant")

def clean_json_string(text: str) -> str:
    """Extract clean JSON from LLM response containing markdown codeblocks."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def get_candidate_gemini_models() -> List[str]:
    """
    Returns prioritized list of Gemini models to try.
    If an experimental or non-existent model (e.g. gemini-3.8-flash) is configured,
    it automatically falls back to officially supported models.
    """
    configured = os.getenv("GEMINI_MODEL", GEMINI_MODEL).strip()
    standard_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    candidates = []
    if configured:
        candidates.append(configured)
    for m in standard_models:
        if m not in candidates:
            candidates.append(m)
    return candidates

def get_candidate_groq_models() -> List[str]:
    """
    Returns prioritized list of Groq models to try.
    Falls back to official fast Groq models (llama-3.3-70b, llama-3.1-8b, mixtral).
    """
    env_str = os.getenv("GROQ_MODELS", GROQ_MODELS_ENV)
    configured = [m.strip() for m in env_str.split(",") if m.strip()]
    standard_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
    candidates = []
    for m in configured:
        if m not in candidates:
            candidates.append(m)
    for m in standard_models:
        if m not in candidates:
            candidates.append(m)
    return candidates

def call_gemini_rest(
    prompt: str,
    system_instruction: str = "",
    model: str = "gemini-2.5-flash",
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    json_mode: bool = False
) -> Optional[str]:
    """Direct REST call to Google Gemini API via httpx (independent of SDK version)."""
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    parts: List[Dict[str, Any]] = []
    if image_bytes:
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": b64
            }
        })
    parts.append({"text": prompt})

    payload: Dict[str, Any] = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    if system_instruction:
        payload["system_instruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text_parts = candidates[0].get("content", {}).get("parts", [])
                    if text_parts:
                        return text_parts[0].get("text", "")
            else:
                print(f"Gemini REST notice ({model}): HTTP {resp.status_code} - {resp.text[:120]}")
    except Exception as e:
        print(f"Gemini REST error ({model}): {e}")

    return None

def call_gemini_sdk(
    prompt: str,
    system_instruction: str = "",
    model: str = "gemini-2.5-flash",
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    json_mode: bool = False
) -> Optional[str]:
    """Calls Google GenAI client if google-genai package is installed."""
    if not genai or not types:
        return None
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        return None

    try:
        client = genai.Client(api_key=api_key)
        contents: List[Any] = [prompt]
        if image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

        config_args: Dict[str, Any] = {"temperature": 0.2}
        if json_mode:
            config_args["response_mime_type"] = "application/json"
        if system_instruction:
            config_args["system_instruction"] = system_instruction

        resp = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(**config_args)
        )
        return resp.text
    except Exception as e:
        print(f"Gemini SDK notice ({model}): {e}")
        return None

def call_groq_chat(prompt: str, system_prompt: str = "", model: str = "llama-3.3-70b-versatile") -> Optional[str]:
    """Calls Groq API via standard OpenAI-compatible completions endpoint."""
    api_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not api_key:
        return None

    messages: List[Dict[str, str]] = []
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
                print(f"Groq API notice ({model}): HTTP {resp.status_code} - {resp.text[:120]}")
    except Exception as err:
        print(f"Groq call error ({model}): {err}")

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

    # 1. Attempt Gemini models with fallback
    for g_model in get_candidate_gemini_models():
        # Try SDK first, then REST
        text = call_gemini_sdk(prompt, model=g_model, image_bytes=image_bytes, mime_type=mime_type, json_mode=True)
        if not text:
            text = call_gemini_rest(prompt, model=g_model, image_bytes=image_bytes, mime_type=mime_type, json_mode=True)

        if text:
            try:
                parsed = json.loads(clean_json_string(text))
                print(f"Successfully processed medical document with Gemini model {g_model}")
                return parsed
            except Exception as pe:
                print(f"JSON parsing error from Gemini ({g_model}): {pe}")

    # 2. Attempt Groq models fallback (for text OCR)
    if raw_ocr_text or not image_bytes:
        for gr_model in get_candidate_groq_models():
            groq_resp = call_groq_chat(prompt=prompt, model=gr_model)
            if groq_resp:
                try:
                    parsed = json.loads(clean_json_string(groq_resp))
                    print(f"Successfully processed medical document via Groq model {gr_model}")
                    return parsed
                except Exception as e:
                    print(f"JSON parse error from Groq ({gr_model}): {e}")

    # 3. Clean neutral fallback if remote LLMs are offline
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
        "review_alerts": [
            "Please confirm medications and dosage directly from your original prescription."
        ]
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
        resp_text = emergency_notices.get(language, emergency_notices["en"])
        return {
            "response": resp_text,
            "reply": resp_text,
            "provider": "safety_rules",
            "model": "clinical_triage",
            "fallback_used": False,
            "is_emergency": True,
            "citations": []
        }

    system_instruction = f"""You are Aarogya, an AI-powered personal health copilot.
User's Preferred Language: {language} (en=English, te=Telugu, hi=Hindi, ta=Tamil).
Respond strictly in {language}.
Patient History Context:
{medical_history_context if medical_history_context.strip() else "No past medical documents uploaded yet."}

Guidelines:
1. Explain medical terms in everyday simple language.
2. Ground all answers in the provided records when available.
3. If no records are uploaded, answer general health questions helpfully while gently reminding the user they can scan prescriptions or lab reports for personalized insights.
4. If lab values are abnormal, mention reference ranges without making definitive diagnostic claims.
5. Never prescribe drugs or change dosages independently."""

    citations: List[Dict[str, str]] = []
    if medical_history_context and medical_history_context.strip():
        citations.append({"document_title": "Uploaded Medical Records", "document_date": "Recent"})

    # 1. Attempt Gemini with fallback
    for g_model in get_candidate_gemini_models():
        text = call_gemini_sdk(prompt=query, system_instruction=system_instruction, model=g_model)
        if not text:
            text = call_gemini_rest(prompt=query, system_instruction=system_instruction, model=g_model)

        if text and text.strip():
            return {
                "response": text.strip(),
                "reply": text.strip(),
                "provider": "gemini",
                "model": g_model,
                "fallback_used": g_model != os.getenv("GEMINI_MODEL", ""),
                "is_emergency": False,
                "citations": citations
            }

    # 2. Attempt Groq fallback
    for gr_model in get_candidate_groq_models():
        groq_resp = call_groq_chat(prompt=query, system_prompt=system_instruction, model=gr_model)
        if groq_resp and groq_resp.strip():
            return {
                "response": groq_resp.strip(),
                "reply": groq_resp.strip(),
                "provider": "groq",
                "model": gr_model,
                "fallback_used": True,
                "is_emergency": False,
                "citations": citations
            }

    # 3. Clean fallback response if all remote AI engines are unavailable
    if medical_history_context and medical_history_context.strip():
        fallback_msg = f"Based on your uploaded records:\n{medical_history_context}\n\nPlease consult your doctor before changing any medications."
    else:
        fallback_msg = "Hello! I am your Aarogya health copilot. I am ready to answer your questions and help you understand medical reports, lab results, and prescriptions in simple language. Please feel free to ask a health question or upload a medical document."

    return {
        "response": fallback_msg,
        "reply": fallback_msg,
        "provider": "local_fallback",
        "model": "rule_based",
        "fallback_used": True,
        "is_emergency": False,
        "citations": citations
    }
