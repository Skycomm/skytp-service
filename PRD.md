# SkyTP v2 — Medical Transcription Service PRD

**Build target:** Production-ready SaaS MVP
**Stack:** Python backend (Windows VM Sky-TP), Next.js/Vercel frontend (Phase 2)
**Repo:** Skycomm/skytp-service
**Last updated:** 2026-03-20

---

## ⚠️ CURRENT PHASE: STEALTH COMPARISON — NO EMAILS TO DOCTORS

Doctors are receiving letters from the existing Windows system. We are **silently running our pipeline in parallel** to compare quality. **Do not send any emails to doctors until David explicitly approves.**

---

## What We're Building

**Phase 1 (NOW):** Python backend service on Sky-TP Windows VM that:
1. Polls `transcriptions@skycomm.com.au` for incoming audio dictations
2. For each dictation, runs **all three pipelines in parallel:**
   - **Original**: The existing SkyTP Windows system output (baseline)
   - **GPT-4.1**: AssemblyAI STT → GPT-4.1 formatting
   - **Claude Sonnet 4.6**: AssemblyAI STT → Claude Sonnet formatting
3. Stores all three outputs for side-by-side comparison
4. **NO emails sent** — comparison mode only
5. Exposes REST API for the dashboard

**Phase 2 (LATER):** Vercel SaaS frontend — Fortune 500 quality dashboard

---

## A/B Testing — The Core Feature

For every dictation received:
- Run original SkyTP prompt on GPT-4.1 → "Original" output
- Run our Claude Sonnet few-shot prompt → "Sonnet" output
- Run our GPT-4.1 prompt → "GPT-4.1" output
- Show all three side-by-side in the dashboard
- Allow David/team to rate each output (thumbs up/down per paragraph)
- Track which model wins over time → data-driven model selection

This gives us **proof** before we ever change what doctors receive.

---

## Architecture

**Deployed:** Python service on Sky-TP (192.168.51.11, VLAN 51, DHCP)
**Service:** `C:\SkyTP\service.py` managed by NSSM (auto-restart, boot start)
**API:** FastAPI on port 8000
**DB:** SQLite at `C:\SkyTP\skytp.db` (migrate to Neon Postgres with Vercel frontend)
**DS2:** NCH Switch (needs installing on Sky-TP)

Replacing: an existing Windows-based file-polling system (SkyTP) that is producing garbled letters and missing deliveries.

---

## Core User Journey

1. **Doctor dictates** into phone/recorder → saves as MP3/WAV/M4A
2. **Submits** either:
   - Emails the audio file to the service inbox (M365 polling)
   - OR uploads via the web portal
3. **System processes** (AssemblyAI STT → LLM formatting)
4. **Doctor receives** formatted RTF letter by email within 2 minutes
5. **Letter also stored** in web portal (doctor can login and download)

---

## API / Environment Variables Required

```env
# AssemblyAI
ASSEMBLYAI_API_KEY=0f67d283c7c849a1b77449db1da6d394

# OpenAI (GPT-4.1)
OPENAI_API_KEY=<from env>

# Anthropic (Claude Sonnet)
ANTHROPIC_API_KEY=<add when building>

# Database (Neon PostgreSQL)
DATABASE_URL=<provision new Neon DB>

# Email (M365 Graph API - to be configured)
AZURE_CLIENT_ID=<from Skycomm M365>
AZURE_CLIENT_SECRET=<from Skycomm M365>
AZURE_TENANT_ID=<from Skycomm M365>
TRANSCRIPTION_EMAIL=transcriptions@skycomm.com.au

# Auth
NEXTAUTH_SECRET=<generate>
NEXTAUTH_URL=https://skytp.vercel.app
```

---

## Database Schema

```sql
-- Doctors/practices
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  practice_name TEXT,
  preferred_model TEXT DEFAULT 'gpt-4.1', -- 'gpt-4.1' | 'claude-sonnet-4-6'
  letterhead_url TEXT, -- S3/Vercel Blob URL for letterhead image
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcription jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id),
  audio_filename TEXT NOT NULL,
  audio_url TEXT, -- Vercel Blob storage URL
  status TEXT DEFAULT 'pending', -- pending|transcribing|formatting|done|failed
  transcript TEXT,
  letter_rtf TEXT,
  letter_url TEXT, -- Vercel Blob URL for delivered letter
  model_used TEXT,
  stt_time_ms INTEGER,
  llm_time_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## LLM Prompts (Model-Specific — CRITICAL: prompt changes with model)

### GPT-4.1 Prompt (use EXACTLY this — 36.15/40 tested)
System prompt = contents of Default Prompt.txt (original SkyTP prompt)

### Claude Sonnet 4.6 Prompt (use EXACTLY this — 37.7/40 tested)
```
You are an expert Australian medical transcription formatter. Convert doctor dictations to referral letters verbatim.

Rules:
1. Every word spoken goes in the letter — no additions, no omissions
2. Spoken punctuation: "new paragraph"→blank line, "full stop"/"stop"→., "comma"→,, "heading X"→**X** heading
3. Self-corrections: use the correction, discard mistake ("sorry" signals correction)
4. Spinal levels: slash only (L4/5 not L4-5)
5. SOAP headings: only if explicitly spoken before letter body
6. Omit secretary routing notes
7. End: Dictated but not sighted or signed by (TRANSCRIBING DOCTOR)
8. Do NOT add dates, addresses, patient details not spoken

Examples:

<example index="1">
Input: Dear Dr Chen. New paragraph. Thank you for referring Michael Thompson, full stop. He presented with lower back pain radiating to the left leg, full stop. New paragraph. I recommend an MRI of the lumbar spine, full stop. Kind regards.
Output:
Dear Dr Chen,

Thank you for referring Michael Thompson. He presented with lower back pain radiating to the left leg.

I recommend an MRI of the lumbar spine. Kind regards.

Dictated but not sighted or signed by (TRANSCRIBING DOCTOR)
</example>

<example index="2">
Input: Dear Dr Patel. Thank you for referring Jane, sorry, Janet Morrison. She is a 67, sorry, 76 year old woman with hypertension. Full stop. Kind regards.
Output:
Dear Dr Patel,

Thank you for referring Janet Morrison. She is a 76 year old woman with hypertension. Kind regards.

Dictated but not sighted or signed by (TRANSCRIBING DOCTOR)
</example>

<example index="3">
Input: Heading problems. One. Discogenic pain at L4-5. Two. Radiculopathy. Dear Dr Wilson. New paragraph. Thank you for referring this gentleman with discogenic pain at L4-5. Full stop. I will organise a disc block. Full stop. Kind regards.
Output:
Dear Dr Wilson,

**Problems**
1. Discogenic pain at L4/5
2. Radiculopathy

Thank you for referring this gentleman with discogenic pain at L4/5. I will organise a disc block. Kind regards.

Dictated but not sighted or signed by (TRANSCRIBING DOCTOR)
</example>
```

**IMPORTANT:** The prompt MUST match the model. Never use the Claude prompt with GPT or vice versa. Store both prompts in code and select based on `doctor.preferred_model`.

---

## Pages / Routes

### Public
- `/login` — email magic link login (NextAuth)

### Doctor Portal (authenticated)
- `/dashboard` — list of recent letters, status
- `/upload` — drag-drop audio upload
- `/letters/[id]` — view/download individual letter (RTF)
- `/settings` — update email, preferred model (dropdown), upload letterhead

### Admin (Skycomm staff)
- `/admin/doctors` — list all doctors, add/edit/deactivate
- `/admin/jobs` — all jobs, status, retry failed
- `/admin/doctors/[id]` — doctor detail, letter history

### API Routes
- `POST /api/jobs` — create job (web upload)
- `GET /api/jobs/[id]` — job status (polling)
- `POST /api/webhook/email` — receive forwarded email attachments
- `GET /api/letters/[id]/download` — download RTF

---

## Email Processing

Poll M365 inbox (`transcriptions@skycomm.com.au`) every 60 seconds using Graph API.

When email arrives with audio attachment:
1. Identify sender email → match to `doctors` table
2. If unknown sender → reply "Sorry, your email is not registered. Contact help@skycomm.com.au"
3. Extract audio attachment
4. Upload to Vercel Blob
5. Create job record
6. Trigger processing pipeline

Polling: use Vercel Cron (every minute) or a background worker.

---

## Processing Pipeline

```
audio file
  → AssemblyAI upload + transcribe (speech_models: ["universal-3-pro"])
  → get transcript text
  → call LLM with model-appropriate prompt
  → get formatted letter text
  → convert to RTF (use rtf-builder npm package or simple string template)
  → save to Vercel Blob
  → send email back to doctor with RTF attachment
  → update job status to 'done'
```

Processing should complete in < 2 minutes for typical 5-minute dictation.

---

## RTF Output

Convert the LLM's markdown output to RTF:
- Bold (`**text**`) → RTF bold
- Bullet points → RTF list
- Paragraph breaks → RTF paragraph
- Use `rtf-builder` or hand-roll a minimal RTF template

---

## Doctor Settings — Model Dropdown

In `/settings` page:
```
Formatting Model:
( ) GPT-4.1 — faster, lower cost
(●) Claude Sonnet 4.6 — highest accuracy

[Save Settings]
```

When model changes, use the matching prompt automatically. No manual prompt editing by doctors.

---

## Initial Doctors (seed data)

```sql
INSERT INTO doctors (name, email, practice_name, preferred_model) VALUES
('Dr Gabriel Lee', 'admin@profglee.com', 'Prof Gabriel Lee - Hollywood Medical Centre', 'gpt-4.1'),
('Prof Gabriel Lee', 'gabriellee2004@rocketmail.com', 'Prof Gabriel Lee', 'gpt-4.1'),
('Dr Grace Gong', 'gracegong@example.com', 'Dr Grace Gong', 'gpt-4.1'),
('Dr Arul Bala', 'arulbala@example.com', 'Dr Arul Bala', 'gpt-4.1'),
('Dr Patrice Mwipatayi', 'patrice@bibombe.com', 'Dr Mwipatayi', 'gpt-4.1'),
('Dr Adnan Khattak', 'adnan@example.com', 'Dr Khattak', 'gpt-4.1');
```

(Update emails from the actual SkyTP Email Lookup.txt config file at /Users/Dolly/Downloads/SkyTP/Email Lookup.txt)

---

## Vercel Deployment

- Framework: Next.js 15 (App Router)
- Database: Neon (PostgreSQL) — provision new project
- Storage: Vercel Blob (audio files + letters)
- Email: M365 Graph API
- Cron: Vercel Cron Jobs (email polling)
- Auth: NextAuth.js with email magic links

Deploy command: `vercel --prod`
Team: dollys-projects-0eabd43f
Vercel token: at ~/.vercel-token

---

## GitHub Setup

Create repo: Skycomm/skytp-service (public — Vercel hobby plan)
PAT: vw get "dolly-works GitHub" field "PAT"

---

## Success Criteria

- [ ] Doctor emails audio → receives RTF letter by email within 2 minutes
- [ ] Web portal shows letter history
- [ ] Upload via web works
- [ ] Model dropdown saves and is used for next job
- [ ] Admin can see all doctors and jobs
- [ ] No hallucinated content in letters (test with 5 known samples)
- [ ] Deploys to Vercel without errors

---

## Phase 1.5 Updates (add to existing build)

### Authentication — Replace magic links with Azure SSO
- Use NextAuth.js AzureAD provider (already in next-auth)
- Skycomm tenant: skycomm.com.au
- Doctors login with their existing Microsoft/Google accounts
- Admin users = Skycomm staff (david@skycomm.com.au, bob@skycomm.com.au)
- Remove email magic link auth entirely
- Azure app registration: create under Skycomm tenant with delegated User.Read permission

### Admin Dashboard — Real-time monitoring
Add `/admin/dashboard` page with:
- **Live job feed** — jobs processing now, last 24h, success/failure rate
- **Per-doctor stats** — letters processed today/week/month, avg processing time
- **System health** — AssemblyAI API status, Claude API status, email polling status (last poll time, next poll)
- **Error log** — failed jobs with reason, retry button
- **Cost tracker** — API spend today/month (AssemblyAI + Claude tokens)
- **Inbox monitor** — last email received, how many unprocessed in queue
- **Model usage split** — % using Claude vs GPT-4.1 across all doctors
- Auto-refresh every 30s (or use Vercel's streaming/SSE)

### DS2 Format Support
Add DS2/DSS conversion to the processing pipeline:
- Use ffmpeg with `-f dss` format flag to convert Philips DS2/DSS files to WAV before sending to AssemblyAI
- Note: ffmpeg DSS decoder has a pitch bug — test output quality, may need fallback
- Supported input formats: wav, mp3, m4a, wma, ds2, dss, flac, ogg, webm
- Convert all non-standard formats to 16kHz mono WAV before STT

## What NOT to Build (Phase 1)

- PDF output (Phase 2)
- Mobile app (Phase 3)
- Per-doctor letterhead in RTF (Phase 2 — letterhead upload UI yes, application to output no)
- Billing/payments
- Multi-tenant (just Skycomm doctors for now)
