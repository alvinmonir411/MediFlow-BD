# PrescriptionMate BD — HealthTech SaaS Platform

> A modern health-tech platform designed to help users understand, organize, and manage their prescriptions and medication routines.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20DB-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%20Vision%20AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 Project Overview

**PrescriptionMate BD** is an offline-friendly, AI-assisted prescription and medication management SaaS platform tailored for Bangladesh.

### Core Philosophy: "AI Extracts, Human Confirms"
The system **does not act as an AI doctor**. AI is restricted to OCR extraction, structured data organization, and patient explanations. All critical medication changes and schedules require explicit review and confirmation by the patient or caregiver, validated against a deterministic database of verified Bangladesh medicines.

---

## 🌟 Core MVP Features

1. **Responsive Healthcare Navigation Bar:** Brand identity, family member switcher, auth pill, and mobile drawer.
2. **Secure Authentication & Sessions:** Email and phone authentication with password hashing (`bcryptjs`) and 30-day JWT sessions (`jose`).
3. **Multi-Patient & Family Profiles (`/family`):** Manage multiple patient profiles (Father, Mother, Self, Child) with blood group, allergies, chronic conditions, and emergency contacts.
4. **Interactive Dashboard (`/`):** Real-time adherence score gauge, pending doses breakdown, quick scan CTA, and architecture health indicators.
5. **Prescription Scanner (`/prescriptions/new`):** Camera & document upload pipeline powered by Google Gemini 3.6 Flash Vision.
6. **AI Prescription OCR & Zod Validation:** Structured extraction of brand name, strength, dosage, frequency (e.g. `1+0+1`), food instruction, and duration.
7. **Verified Bangladesh Medicine Resolver:** Matches extracted names against an authentic catalog of Bangladesh medications (Square, Beximco, Incepta, Acme, Healthcare) with color-coded confidence badges (Green ≥90%, Yellow <90%).
8. **Prescription Human Verification Studio:** Side-by-side review of extracted medicines with editable dosage and food timing before committing to database.
9. **Medication Schedule Generator:** Generates automated recurring daily schedules based on prescription frequency.
10. **Today's Dose Tracker (`/doses`):** Filter by Morning, Afternoon, and Night time slots with 1-click "Mark as Taken" (audio chime & confetti) and "Skip" with reason.
11. **Dose State Machine:** Full state transitions (`SCHEDULED`, `TAKEN`, `MISSED`, `SKIPPED`).
12. **Emergency Medical ID (`/emergency-id`):** Offline-ready lock screen health profile with blood group, EMT QR code, and click-to-call emergency contact.
13. **Zero-Trust Security & Audit Trail (`/audit-logs`):** Immutable log of every prescription upload, verification, and dose event.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.5+ (App Router, React 19, TypeScript) |
| **Database** | PostgreSQL on Neon Serverless |
| **ORM & Migrations** | Prisma ORM 6.x |
| **AI Vision Model** | Google Gemini 3.6 Flash Vision |
| **Schema Validation** | Zod 3.x |
| **Styling & Design** | Tailwind CSS + Lucide Icons + Canvas Confetti |
| **Auth & Security** | bcryptjs + jose JWT + HTTP-only cookies |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/alvinmonir411/MediFlow-BD.git
cd MediFlow-BD
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create `.env` (or `.env.local`):
```env
# Neon PostgreSQL Database Connection
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# JWT Secret
JWT_SECRET="your-super-secure-secret-key-32-chars-long"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push database schema & seed Bangladesh medicines
```bash
npx prisma db push
npm run prisma:seed
```

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or port 3001) in your browser.

---

## 🔌 API Architecture (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user & create tenant organization |
| `POST` | `/api/v1/auth/login` | Authenticate user & set JWT session |
| `GET` | `/api/v1/auth/me` | Fetch active session & family profiles |
| `POST` | `/api/v1/auth/logout` | Clear session cookie |
| `GET` | `/api/v1/patients` | List all family patient profiles |
| `POST` | `/api/v1/patients` | Create new family patient profile |
| `POST` | `/api/v1/ai/extract-prescription` | Gemini 3.6 Flash Vision OCR extraction |
| `POST` | `/api/v1/prescriptions/confirm` | Human confirmation & schedule activation |
| `GET` | `/api/v1/doses` | Fetch today's doses & adherence percentage |
| `POST` | `/api/v1/doses` | Update dose status (`TAKEN` / `SKIPPED`) |

---

## 📄 License
This project is developed for educational and healthcare management purposes under the DGDA Bangladesh digital health guidelines.
