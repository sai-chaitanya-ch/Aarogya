# Aarogya — AI-Powered Personal Health Copilot
**Altrix Labs · Product Refinement & Feature Blueprint**

> **"Understand. Organize. Manage. A Healthier You."**  
> *Better Health, Brighter Tomorrows.*

Aarogya is an AI-powered, multilingual personal health copilot designed to help individuals organize, understand, and manage their healthcare journey through an accessible, mobile-first platform.

---

## 🌟 The Five Core Pillars

1. **Understand Medical Records**
   * Upload prescriptions, paper lab reports, or discharge summaries via camera or file upload.
   * Built-in **Crop & Adjust** tool (rotate, enhance readability, crop).
   * Intelligent OCR and medical-field extraction for patient name, visit dates, doctor/clinic, medications (dosages, frequencies like `OD`, `BD after food`), and laboratory values with reference ranges.
   * Field-level verification allowing users to correct extracted information before committing.

2. **Build a Unified Health Profile**
   * Searchable medical record library (reports, prescriptions, discharge summaries, imaging).
   * Chronological interactive health timeline of encounters and test findings.
   * Historical metric trends for Hemoglobin (Hb), Fasting Blood Sugar, and Blood Pressure with reference bands.

3. **Make Healthcare Understandable**
   * Translates complex medical jargon into everyday language.
   * Multilingual support across **English**, **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **Tamil (தமிழ்)**.
   * Speech-to-Text voice query input and Text-to-Speech audio readout for explanations.
   * Values outside reference ranges flagged with medical safety guidance (*"This is not a diagnosis"*).

4. **Help Users Stay Organized**
   * Daily medication schedule (Morning, Afternoon, Evening, Night) with adherence tracking.
   * Interactive *"Take now"* actions with celebration effects.
   * Doctor appointment scheduler for In-person and Teleconsultation visits.
   * Nearby doctor directory with ratings, consultation fees, and verified credentials.

5. **Connect Patients and Doctors (Dedicated Doctor Portal)**
   * Complete 12-screen healthcare professional portal.
   * Doctor onboarding (registration, qualifications, clinic hours).
   * Patient management (search by name, phone, or ABHA; filter by Follow-up, Recent, Chronic).
   * Prescription builder (add medicines with frequency and instructions, follow-up date picker, draft/publish).
   * Instant synchronization from doctor to patient's library and reminder schedules.
   * Teleconsultation and doctor-patient chat.

6. **Ayushman Bharat Digital Mission (ABDM) / ABHA Ready**
   * Consent-first transparent linking flow.
   * Link ABHA using any of 3 methods: **14-digit ABHA Number**, **Aadhaar Number**, or **Mobile Number**.
   * Simulated OTP gateway verification.
   * ABHA Digital Health Card generator with QR code and address (`@abdm`).
   * Direct linking to the official [ABHA Registration Portal](https://abha.abdm.gov.in/abha/v3/register).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/sai-chaitanya-ch/Aarogya.git
cd Aarogya

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## ☁️ Deployment Architecture & Hosting

### 1. Frontend on Netlify
* Configured with `netlify.toml` including SPA rewrite rules (`/*` → `/index.html`) and healthcare security headers.
* **To Deploy**:
  1. Go to [Netlify](https://app.netlify.com/) and click **"Add new site"** → **"Import an existing project"**.
  2. Select your GitHub repository `sai-chaitanya-ch/Aarogya`.
  3. Set Build Command: `npm run build` and Publish Directory: `dist`.
  4. Under **Environment variables**, set:
     * `VITE_API_URL`: Your Render backend URL (e.g. `https://aarogya-api.onrender.com`)
     * `VITE_SUPABASE_URL`: Your Supabase Project URL
     * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key

### 2. Backend (FastAPI) on Render
* Configured with `render.yaml` and `backend/requirements.txt`.
* **To Deploy**:
  1. Go to [Render Dashboard](https://dashboard.render.com/) and select **"Blueprints"** or **"New Web Service"**.
  2. Connect repository `sai-chaitanya-ch/Aarogya`.
  3. Root Directory: `backend`.
  4. Build Command: `pip install -r requirements.txt`.
  5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
  6. Add **Environment Variables**:
     * `GEMINI_API_KEY`: Your Google Gemini API Key.
     * `SUPABASE_URL`: Your Supabase project URL.
     * `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret key.

### 3. Database & Storage on Supabase
* **PostgreSQL with Row Level Security (RLS)** & **Private Storage Bucket**:
  1. In your [Supabase Dashboard](https://supabase.com/dashboard), open the **SQL Editor**.
  2. Copy and paste the entire script from `supabase/schema.sql`.
  3. Run the script. It creates:
     * `profiles`, `doctor_profiles`, `medical_documents`, `medication_reminders`, `appointments`, and `abha_profiles`.
     * Strict RLS policies so patients can only access their records, and verified doctors only access authorized patients.
     * Private `medical-records` bucket configured with signed URL access (no public URLs).

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Effects**: Canvas Confetti
* **Speech Integration**: Web Speech API (SpeechRecognition & SpeechSynthesis)
* **Architecture**: Mobile-first responsive layout with interactive Device Frame / Expanded View toggle

---

## 👥 Team Collaboration

To invite your team members:
1. Go to the repository **Settings** → **Collaborators** on GitHub.
2. Click **Add people** and enter your team members' GitHub usernames or emails.
3. Once they accept the invitation, they can clone, create branches, and push commits directly.

```bash
# Workflow for team members
git checkout -b feature/your-feature-name
# Make your edits
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

---

## 📄 License
MIT License. Built by Altrix Labs.
