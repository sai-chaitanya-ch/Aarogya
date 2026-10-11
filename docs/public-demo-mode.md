# Aarogya Public Passwordless Demo Mode Architecture

## 1. Overview
Aarogya Public Passwordless Demo Mode allows any visitor to explore the entire application with one click, without supplying email credentials, passwords, or personal health records.

Visitors can select between two isolated personas:
1. **Patient Demo**: Pre-loaded with synthetic CBC lab report, iron supplement prescription, medication reminders, and ABDM card simulation.
2. **Doctor Demo**: Opens the Clinical Workspace with synthetic patients and pending credential verification state.

Both modes are backed by Supabase Auth's anonymous sign-in API (`signInAnonymously()`), guaranteeing real cryptographic session tokens while maintaining strict isolation from production tables and permanent private storage.

---

## 2. Supabase Anonymous Authentication Configuration

### 2.1 Enabling Anonymous Sign-ins in Supabase Dashboard
To support passwordless demo mode on the deployed project:
1. Navigate to the **Supabase Dashboard** -> **Authentication** -> **Providers**.
2. Locate **Anonymous Sign-ins** in the provider list.
3. Toggle the status to **Enabled**.
4. Save configuration.

> **Note:** If anonymous sign-ins are disabled in the Supabase dashboard, Aarogya's frontend gracefully catches the provider error and informs the visitor:
> *"Anonymous demo sign-ins are not enabled in your Supabase project. Please enable Anonymous Sign-Ins under Supabase Authentication > Providers."*

### 2.2 Bot Protection & Rate Limiting (CAPTCHA)
To protect anonymous and public authentication endpoints from abuse:
1. **Cloudflare Turnstile CAPTCHA Integration**:
   - Aarogya includes a reusable React component (`TurnstileWidget`) rendered conditionally inside `AuthModal` when `VITE_TURNSTILE_SITE_KEY` is configured.
   - Captured verification tokens are passed as the `captchaToken` option to Supabase Auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, and `signInAnonymously`).
   - The Turnstile widget resets automatically after each consumed token, handling expired and error states cleanly.
   - **Secret Key Security**: The Turnstile Secret Key is configured **only** in the Supabase Dashboard under **Authentication > Bot Protection / Security**. It is never included in client bundles, `.env` files, or Git repositories.
2. **Backend Rate Limiting**:
   - The Aarogya FastAPI backend (`backend/main.py`) validates `user.is_anonymous`.
   - For all anonymous tokens, a sliding window rate limiter limits traffic to a maximum of **10 requests per 5 minutes** per anonymous session on `/api/chat` and `/api/documents/process`.
   - Anonymous requests exceeding this threshold receive HTTP `429 Too Many Requests`.

---

## 3. Synthetic Data Boundaries & Isolation

### 3.1 Strict Database Isolation
When `is_anonymous` is true:
- **No Supabase Table Queries**: The application completely bypasses `select`, `insert`, `update`, and `delete` on `profiles`, `doctor_profiles`, `medical_documents`, `medication_reminders`, and `appointments`.
- **No Supabase Storage Writes**: Scanned test documents in demo mode are not uploaded to `medical-records/{user_id}/`.
- **No Production RAG Indexing**: Calls to `/api/rag/index` and `/api/rag/reindex` are blocked for anonymous sessions (HTTP 403), preventing synthetic or temporary data from polluting pgvector embeddings.
- **No Supabase Realtime Subscriptions**: Realtime postgres change listeners are not mounted for anonymous sessions.

### 3.2 Scoped Browser Storage
- Mutations made by the demo visitor (e.g. marking a reminder as taken, booking an appointment, or testing document extraction) are stored strictly inside the browser's `sessionStorage` under `aarogya_demo_health_<userId>_*`.
- Visitors can click **Reset Data** on the top persistent demo banner at any time to restore the initial synthetic baseline.
- Signing out or closing the browser clears the session.

### 3.3 Doctor Demo Role & Verification
- Demo doctor profiles are marked `isDoctorVerified = false`.
- Even in demo mode, the application preserves the security invariant: unverified practitioners are prohibited from accessing real patient records.
- The patient list displayed in the Doctor Demo is drawn exclusively from synthetic fixtures (`DEMO_DOCTOR_PATIENTS`).

---

## 4. Server-Side AI Chat Grounding

When an anonymous demo user chats with the AI copilot via `/api/chat`:
- The server does **not** query pgvector or RAG database tables for other users' health records.
- The prompt is grounded in a server-owned synthetic health record (`DEMO_SYNTHETIC_CONTEXT`), covering Demo Patient A's mild anemia CBC and Ferrous Ascorbate prescription.
- The response returns structured synthetic citations (`[S1]`, `[S2]`) with retrieval mode `demo_synthetic`.

---

## 5. Security Summary Matrix

| Capability | Real Authenticated User | Passwordless Demo User |
| :--- | :--- | :--- |
| **Authentication Token** | Supabase JWT (`is_anonymous: false`) | Supabase JWT (`is_anonymous: true`) |
| **Database Tables** | Authorized via Row-Level Security (RLS) | Zero database queries (in-memory fixtures) |
| **Supabase Storage** | Encrypted `medical-records/{uid}/` bucket | Blocked; blob URLs in-browser only |
| **RAG Retrieval** | Server-side vector match on user records | Fixed server-side synthetic record excerpt |
| **Rate Limiting** | Standard application thresholds | 10 requests / 5 minutes sliding window |
| **Doctor Credentials** | Verified via healthcare provider registry | Fictional demo practitioner (`is_verified: false`) |
