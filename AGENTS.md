# MediFlow BD (PrescriptionMate BD) — Agent Guidelines & System Memory

> **System Rule:** This file is permanently loaded by the agent. You MUST follow these principles and architecture rules in every prompt, task, and code generation within this project.

---

## 1. Core Product Identity & Boundaries

- **Product Name:** MediFlow BD / PrescriptionMate BD
- **Type:** Prescription & Medication Management Platform
- **CRITICAL BOUNDARY:** **This is NOT an "AI Doctor".**
  - AI is strictly restricted to: **Extraction (OCR) + Explanation (Bangla/English) + Alerting**.
  - AI MUST NEVER diagnose conditions, prescribe medications, or alter dosages autonomously.
  - Medication safety, drug-drug interactions, and contraindications MUST be handled by deterministic Rule Engines + Verified Medical Databases, not LLM generations.
  - Compliance with DGDA (Directorate General of Drug Administration) guidelines and Bangladesh Digital Health Strategy 2023–2027.

---

## 2. The 5 Non-Negotiable Engineering Laws

1. **AI Extracts, Human Confirms:**
   Gemini Vision extracts structured JSON -> validated by Zod -> resolved against verified medicine database -> confidence scored -> **requires explicit human (patient/doctor) confirmation** before saving or scheduling.
2. **Rule Engine & Database for Safety:**
   Drug interactions, duplicate therapy, allergy alerts, and dosage range checks are evaluated by deterministic databases and rule engines, NEVER solely by generative AI.
3. **Offline-First Primary Reminders:**
   Primary medication alarms are native/local (SQLite / local notifications on device). Cloud sync (Next.js + Postgres + Redis/QStash) handles escalation, caregiver alerts, analytics, and cross-device sync.
4. **Tenant Isolation & Zero-Trust Security:**
   Multi-tenant SaaS with `organization_id` on every query. Never trust `patient_id` from client payloads without verifying JWT -> organization -> patient ownership -> RBAC permissions. All clinical/medication changes write to an immutable `audit_logs` table.
5. **Phase-Driven / Ruthless MVP First:**
   Do NOT attempt all 19 features at once. Build the core vertical slice (Auth -> Patient -> Prescription OCR -> Medicine Resolver -> Verification UI -> Schedule -> Local Alarm -> Dose Tracking) before expanding.

---

## 3. Technology Stack

- **Mobile:** React Native + Expo (Local SQLite, native push/local notifications, camera, secure storage).
- **Backend & Web:** Modular Monolith in Next.js (TypeScript, Tailwind CSS, shadcn/ui, Zod, React Query).
- **Database:** PostgreSQL (Neon / Prisma ORM) with strict relational schemas.
- **Background Jobs & Queue:** Redis / QStash for dose escalation and async messaging (WhatsApp Cloud API).
- **AI Pipelines:**
  - Gemini 2.5 Flash Vision for OCR extraction (structured JSON output with Zod validation).
  - Versioned prompts in database/config (never hardcoded in route handlers).
  - Explicit extraction boundary preventing prompt injections.

---

## 4. Master Blueprint Reference

For complete database schemas, architecture diagrams, state machines, API routes, and feature roadmaps, read:
👉 [PROJECT_BLUEPRINT.md](file:///c:/Users/Alvin%20Monir/Desktop/MediFlow%20BD/PROJECT_BLUEPRINT.md)
