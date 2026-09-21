---
trigger: always_on
---

# MediFlow BD — Medical Safety & Architecture Rules

1. **AI Medical Boundaries:**
   - MediFlow BD is a medication management platform, NOT an AI doctor.
   - Never allow LLMs to prescribe medicine, modify dosage, or diagnose medical conditions autonomously.
   - LLMs are restricted to: OCR data extraction, patient-friendly explanations in Bengali/English, and event alerting.

2. **Human-in-the-Loop Confirmation:**
   - Every AI extraction from prescription images MUST pass through Zod schema validation, medicine database resolution, and explicit human confirmation before committing to the schedule.

3. **Deterministic Safety Rules:**
   - Drug interactions, allergies, and dosage ceiling checks MUST come from deterministic databases/rules, never generative text output alone.

4. **Offline-First Alarms:**
   - Primary medication alarms must be local to the device (native scheduled notifications / SQLite). Cloud notifications are secondary escalations.

5. **Security & Audit:**
   - Enforce tenant isolation (`organization_id`) and granular RBAC on every endpoint.
   - Every medication change, dose log, and AI extraction event must write an entry to `audit_logs`.
