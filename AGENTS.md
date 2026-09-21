# Assignment Category: PrescriptionMate BD — HealthTech SaaS Platform

> **System Rule:** This file is permanently loaded by the agent. You MUST follow these principles and architecture rules in every prompt, task, and code generation within this project.

📌 **Project Type:** Full-Stack SaaS / HealthTech Platform  
📌 **Primary Stack:** MERN / Next.js + PostgreSQL  
📌 **Authentication:** Secure Email/Password + Google Login  
📌 **AI:** Gemini Vision  
📌 **Mobile:** React Native / Expo  
📌 **Database:** PostgreSQL (Neon / Prisma ORM)  
📌 **Deployment:** Vercel + Managed Database/Storage  

---

# Project Overview

In this project, you will build **PrescriptionMate BD**, a modern health-tech platform designed to help users understand and manage their prescriptions and medication routines.

The main purpose of the platform is to make prescription management easier by allowing users to upload a prescription, extract medicine information using AI, confirm the extracted information, create medication schedules, receive reminders, track doses, and maintain their prescription history.

The platform should be designed with a strong focus on:

* Simplicity
* Reliability
* Responsive design
* Data privacy
* Secure authentication
* Offline-friendly medication reminders
* User-friendly medication management

The system should **not act as an AI doctor**. AI will assist with extracting and organizing information from prescriptions, while important medication information must be reviewed and confirmed by the user.

---

# How the System Works

The basic system flow will be:

```text
User Registration/Login
        ↓
Create Patient Profile
        ↓
Upload Prescription
        ↓
AI Prescription Scanner
        ↓
Extract Medicine Information
        ↓
Validate & Match Medicine
        ↓
User Reviews & Confirms
        ↓
Create Medication Schedule
        ↓
Medication Reminder
        ↓
User Marks Dose
        ↓
Dose History
        ↓
Adherence Dashboard
```

The MVP should focus on making this complete flow stable before adding advanced features.

---

# MVP Features

The first version of PrescriptionMate BD must include the following features:

1. Navigation Bar
2. Authentication
3. Patient Profile
4. Dashboard
5. Prescription Upload
6. AI Prescription Scanner
7. Medicine Extraction
8. Medicine Confirmation
9. Medication Schedule
10. Medication Reminder
11. Dose Tracking
12. Missed Dose Escalation
13. Prescription History
14. Emergency Medical ID
15. Basic Adherence Dashboard
16. Responsive UI
17. Secure Database
18. Admin/Audit System

---

# 1. Navigation Bar

The navigation bar should be visible throughout the main application.

### Logo / Website Name

Display:

**PrescriptionMate BD**

The branding should communicate:

* Healthcare
* Medication
* Trust
* Simplicity

### Navigation Links

For normal users:

* Home
* Dashboard
* Prescriptions
* Medications
* Emergency ID

Authenticated users should see their profile/avatar.

Profile dropdown can contain:

* My Profile
* Dashboard
* Prescriptions
* Medications
* Emergency ID
* Logout

If the user is not logged in:

* Login
* Register

---

# 2. Authentication

Create a secure authentication system.

### Login

Required fields:

* Email
* Password

Social login:

* Google Login

### Register

Required fields:

* Name
* Email
* Password
* Profile Photo URL (optional)

Password requirements:

* Minimum 6 characters
* At least one uppercase letter
* At least one lowercase letter

Show proper:

* Validation errors
* Loading state
* Success notification
* Error notification

---

# 3. Patient Profile

After registration, users should be able to create their patient profile.

### Basic Information

* Full Name
* Date of Birth
* Gender
* Blood Group
* Phone Number
* Address

### Important Medical Information

* Known Allergies
* Existing Conditions
* Emergency Contact

Users should be able to update their information later.

---

# 4. Dashboard

The dashboard should give users a quick overview of their medication activity.

### Dashboard Cards

Example:

```text
Today's Medicines
5

Taken
3

Pending
1

Missed
1
```

Additional sections:

* Today's medication schedule
* Upcoming dose
* Recent prescriptions
* Adherence percentage
* Emergency ID shortcut

The dashboard should remain simple and easy to understand.

---

# 5. Prescription Upload

Users should be able to upload prescription images.

### Supported Input

* Camera
* Gallery
* Image upload

The interface should clearly show:

**Upload Prescription**

After upload:

```text
Uploading...
       ↓
Processing...
       ↓
AI Reading Prescription...
       ↓
Review Results
```

---

# 6. AI Prescription Scanner

The system will use Gemini Vision to extract information from prescription images.

The AI should attempt to identify:

* Medicine name
* Strength
* Dose
* Frequency
* Duration
* Food instruction
* Additional instruction

Example:

```text
Medicine:
Napa

Strength:
500 mg

Dose:
1 tablet

Frequency:
1+0+1

Duration:
5 days

Instruction:
After food
```

---

# 7. AI Validation

AI output must never be stored directly as a confirmed medication.

The process should be:

```text
AI Output
   ↓
Schema Validation
   ↓
Medicine Database Matching
   ↓
Confidence Check
   ↓
User Confirmation
```

If information is unclear, the user must manually review it.

Example:

> We couldn't confidently identify this medicine. Please verify the medicine name before continuing.

---

# 8. Medicine Database

The system should maintain a structured medicine database.

Each medicine can contain:

```text
Medicine ID
Brand Name
Generic Name
Strength
Dosage Form
Manufacturer
Status
```

Example:

```json
{
  "brand_name": "Napa",
  "generic_name": "Paracetamol",
  "strength": "500 mg",
  "dosage_form": "Tablet"
}
```

The medicine resolver should use this database to match AI-extracted medicine names.

---

# 9. Medicine Confirmation

After AI extraction, show the user a review screen.

Example:

```text
Prescription Review

✓ Napa 500 mg
  1 tablet
  1+0+1
  5 days

✓ Omeprazole 20 mg
  1 capsule
  1+0+0
  7 days
```

Buttons:

**Confirm Prescription**

**Edit Information**

Only after confirmation should medication schedules be created.

---

# 10. Medication Schedule

Users should be able to create and edit schedules.

Each medication schedule can contain:

* Medicine
* Dose
* Frequency
* Start Date
* End Date
* Reminder Time
* Before/After Food

Example:

```text
Napa 500 mg

Dose:
1 Tablet

Time:
9:00 AM

Frequency:
Daily

Duration:
5 Days
```

---

# 11. Medication Reminder

Medication reminders are one of the most important features.

The mobile app should support local notifications so basic reminders can work even when the internet is unavailable.

Example notification:

> 💊 Time to take Napa 500 mg

Actions:

* Taken
* Remind Me Later
* Skip

---

# 12. Dose Tracking

Every scheduled dose should have a state.

Possible states:

```text
SCHEDULED
REMINDER_SENT
SNOOZED
TAKEN
MISSED
SKIPPED
CANCELLED
ESCALATED
```

When the user presses **Taken**, the system records:

* Dose ID
* Time
* User
* Action
* Source

Example:

```text
Napa 500 mg
09:00 AM

✓ Taken at 09:04 AM
```

---

# 13. Missed Dose Escalation

The system should have a configurable escalation mechanism.

### Level 1

At scheduled time:

> Your medication time has arrived.

### Level 2

After approximately 15 minutes:

> You haven't confirmed this dose yet.

### Level 3

After approximately 45 minutes:

Additional reminder to the patient.

### Level 4

After approximately 60 minutes:

If the dose remains unconfirmed and caregiver notification is enabled:

> Caregiver notification

The exact timing should be configurable.

The system must prevent duplicate escalation notifications.

---

# 14. Prescription History

Users should be able to view previously uploaded prescriptions.

Each prescription card can show:

* Prescription date
* Number of medicines
* Status
* Upload date

Example:

```text
Prescription
12 September 2026

4 Medicines

View Prescription
```

Users should be able to open the prescription and see its extracted/confirmed medicines.

---

# 15. Emergency Medical ID

Create an Emergency Medical ID that can be accessed quickly.

Information may include:

* Name
* Blood Group
* Allergies
* Important Conditions
* Emergency Contact
* Phone Call Action

The user should control which fields are visible.

The Emergency ID should be designed to work with minimal dependency on internet connectivity.

---

# 16. Adherence Dashboard

The MVP dashboard should show simple medication adherence information.

Example:

```text
Medication Adherence

Taken       82%
Missed      12%
Skipped      6%
```

Additional information:

* Today's doses
* Weekly adherence
* Missed doses
* Completed doses

The dashboard should present recorded medication activity rather than making medical diagnoses.

---

# 17. Future Feature — Family Care

After the MVP is stable, add family/caregiver functionality.

Features:

* Multiple patient profiles
* Family members
* Caregiver access
* Caregiver permissions
* Caregiver medication alerts
* WhatsApp notifications

Example:

```text
Mother
   ↓
Medication Reminder
   ↓
Dose Missed
   ↓
Caregiver Alert
```

---

# 18. Future Feature — Bangla Voice Commands

Users will eventually be able to use simple Bangla/Banglish commands.

Example:

> "হ্যাঁ খেয়েছি"

System:

```text
DOSE → TAKEN
```

Example:

> "একটু পরে খাব"

System:

```text
DOSE → SNOOZED
```

If the command is unclear, the system should ask the user to confirm instead of guessing.

---

# 19. Future Feature — Lab Report Decoder

Later users will be able to upload medical lab reports.

Flow:

```text
Lab Report
   ↓
OCR / AI Extraction
   ↓
Test Identification
   ↓
Reference Range
   ↓
Result Explanation
```

The system should explain recorded values and reference ranges without presenting an AI-generated diagnosis as a confirmed medical diagnosis.

---

# 20. Future Feature — Vitals Tracker

Users will eventually be able to record:

* Blood Pressure
* Blood Glucose
* Weight
* Temperature
* SpO2
* Heart Rate

The dashboard can display historical trends.

---

# 21. Future Feature — Medicine Interaction

Drug/food interaction warnings should eventually use a verified medical/rule database.

AI can help explain an already verified warning in simple Bangla.

The LLM should not be the sole source of safety-critical interaction rules.

---

# 22. Future Feature — Refill & Pill Counter

Users can later track:

```text
Total Pills
Remaining Pills
Daily Usage
Estimated Remaining Days
```

Example:

> 8 tablets remaining

> Estimated supply: 4 days

---

# 23. Future Feature — Doctor Summary

Generate a simple doctor-visit summary.

Example:

```text
Patient Summary

Current Medicines
Recent Missed Doses
Adherence
Recent BP Records
Recent Glucose Records
Important Notes
```

The patient should control whether and when the report is shared.

---

# 24. Future Feature — Pharmacy & Diagnostic Services

Later versions may include:

* Pharmacy directory
* Emergency pharmacy
* Oxygen directory
* Medicine ordering
* Diagnostic booking
* Home sample collection
* Partner clinics
* White-label clinic version

These features should be added only after the core medication system is stable.

---

# 25. Database Architecture

### Users

```json
{
  "_id": "...",
  "name": "User Name",
  "email": "user@example.com",
  "photo": "...",
  "role": "PATIENT",
  "created_at": "..."
}
```

### Patients

```json
{
  "_id": "...",
  "user_id": "...",
  "name": "Patient Name",
  "date_of_birth": "...",
  "blood_group": "B+",
  "allergies": [],
  "emergency_contact": "..."
}
```

### Prescriptions

```json
{
  "_id": "...",
  "patient_id": "...",
  "image_url": "...",
  "status": "CONFIRMED",
  "created_at": "..."
}
```

### Prescription Medicines

```json
{
  "_id": "...",
  "prescription_id": "...",
  "medicine_id": "...",
  "raw_name": "Napa",
  "strength": "500 mg",
  "dose": "1",
  "frequency": "1+0+1",
  "duration_days": 5,
  "instruction": "after_food",
  "confidence": 0.96,
  "verified": true
}
```

### Medication Schedules

```json
{
  "_id": "...",
  "patient_id": "...",
  "medicine_id": "...",
  "start_date": "...",
  "end_date": "...",
  "times": ["09:00", "21:00"],
  "active": true
}
```

### Dose Instances

```json
{
  "_id": "...",
  "schedule_id": "...",
  "due_at": "...",
  "status": "TAKEN",
  "confirmed_at": "..."
}
```

---

# 26. Recommended Project Structure

```text
prescriptionmate/

├── apps/
│   ├── mobile/
│   ├── web/
│   └── admin/

├── packages/
│   ├── ui/
│   ├── db/
│   ├── types/
│   ├── validation/
│   ├── ai/
│   └── medicine/

├── workers/
│   ├── reminders/
│   ├── whatsapp/
│   └── reports/

├── prisma/
└── docs/
```

---

# 27. Security Requirements

The project must follow secure development practices.

### Environment Variables

Never expose:

* Database credentials
* Gemini API key
* Firebase secrets
* WhatsApp API secrets
* Private storage credentials

Use environment variables.

Example:

```text
DATABASE_URL=
GEMINI_API_KEY=
FIREBASE_API_KEY=
WHATSAPP_ACCESS_TOKEN=
```

### Authorization

Users should only be able to access resources they are authorized to access.

For example:

User A must never be able to access User B's:

* Prescription
* Medication
* Dose history
* Patient information

by simply changing an ID in the URL.

---

# 28. Responsive Design

The application must be fully responsive.

Test on:

* Mobile
* Tablet
* Laptop
* Desktop

Important areas:

* Dashboard
* Prescription scanner
* Medicine review
* Medication schedule
* Tables
* Modals
* Navigation
* Emergency ID

Mobile experience should be treated as a primary experience, not just a smaller desktop layout.

---

# 29. UI/UX Requirements

Design should be:

* Clean
* Modern
* Professional
* Accessible
* Easy to understand
* Healthcare-focused
* Not overly crowded

Use:

* Proper spacing
* Clear typography
* Consistent buttons
* Clear status indicators
* Good contrast
* Loading states
* Empty states
* Error states
* Success notifications

Avoid copying an existing healthcare application's design.

---

# 30. Animation

Optional but recommended:

* Framer Motion
* AOS
* Smooth page transitions
* Card hover effects
* Modal animations
* Loading animations

Animations should improve the experience rather than make the interface distracting.

---

# 31. Error Handling

The system must handle:

* Invalid prescription image
* AI extraction failure
* Unknown medicine
* Low confidence extraction
* Network failure
* Database failure
* Expired session
* Unauthorized request
* Notification permission denied
* Offline state

Show useful user-friendly messages instead of raw server errors.

---

# 32. Deployment Guidelines

The deployed application must work correctly in production.

Before submission:

* No CORS errors
* No 404 errors
* No 500 errors
* No broken API requests
* No exposed API keys
* No broken private routes
* No database connection errors
* No broken refresh behavior

The application must continue working correctly after refreshing a route.

---

# 33. Authentication Deployment

If Firebase Authentication is used:

* Add production domain to Firebase authorized domains.
* Verify Google login works on the production domain.
* Verify authentication state survives page refresh.
* Protect private routes properly.

If a different authentication system is used, follow equivalent production security practices.

---

# 34. README Requirements

The GitHub repository must contain a detailed `README.md`.

README should include:

### Project Name

PrescriptionMate BD

### Project Description

Short explanation of the product.

### Live URL

Production website URL.

### Features

List all implemented features.

### Technology Stack

Example:

```text
Next.js
React
TypeScript
Node.js
Express.js
PostgreSQL
Prisma
Firebase
Gemini API
React Native
Expo
Tailwind CSS
```

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Document required variables without exposing actual secret values.

### API Information

Document major API endpoints.

---

# 35. Git Commit Requirements

Maintain meaningful commit history.

Recommended minimum:

### Client

**15+ meaningful commits**

Examples:

```text
feat: create responsive navbar
feat: implement authentication pages
feat: add patient dashboard
feat: create prescription upload UI
feat: integrate prescription scanner
feat: add medicine review interface
feat: implement medication schedule
feat: add reminder UI
feat: implement dose tracking
feat: add prescription history
feat: create emergency medical ID
feat: add adherence dashboard
fix: improve mobile dashboard layout
fix: handle prescription upload errors
refactor: improve medication components
```

### Server

**8+ meaningful commits**

Examples:

```text
feat: setup express server
feat: connect PostgreSQL database
feat: create patient API
feat: create prescription API
feat: integrate AI extraction service
feat: add medication schedule API
feat: implement dose tracking
fix: improve authorization middleware
```

Avoid meaningless commits such as:

```text
update
final
test
changes
done
```

---

# 36. Testing Requirements

Before submission test:

### Authentication

* Register
* Login
* Logout
* Google Login
* Invalid password
* Invalid email
* Refresh page

### Prescription

* Upload
* Invalid image
* AI extraction
* Low-confidence extraction
* Manual correction
* Confirmation

### Medication

* Create schedule
* Edit schedule
* Delete schedule
* Reminder
* Take dose
* Snooze
* Missed dose

### Security

* Unauthorized API request
* Invalid user ID
* Access another user's data
* Expired authentication
* Rate limiting

### Responsive

* Mobile
* Tablet
* Desktop

---

# 37. What to Submit

The final submission should contain:

### 1. Live Site

Fully functional deployed application.

### 2. Client Repository

GitHub repository containing:

* Frontend code
* Commit history
* README

### 3. Server Repository

GitHub repository containing:

* Backend/API code
* Database logic
* Commit history
* README

### 4. Demo Credentials

If necessary, provide test account credentials separately.

### 5. Documentation

Include:

* Setup instructions
* Environment variables
* Architecture overview
* API documentation
* Feature documentation

---

# 38. Development Roadmap

## Phase 1 — MVP

```text
Authentication
       ↓
Patient Profile
       ↓
Prescription Upload
       ↓
AI Extraction
       ↓
Medicine Verification
       ↓
Medication Schedule
       ↓
Reminder
       ↓
Dose Tracking
       ↓
Adherence Dashboard
       ↓
Emergency ID
```

## Phase 2 — Family Care

```text
Multi Patient
Caregiver
WhatsApp
Voice Commands
Doctor Summary
Refill
Vitals
```

## Phase 3 — Clinical Assistance

```text
Lab Decoder
Interactions
Food Rules
Expiry Scanner
Trend Analysis
Injection Tracker
```

## Phase 4 — Healthcare Marketplace

```text
Pharmacy
Medicine Ordering
Diagnostics
Home Sample
Clinic Integration
White Label
```

---

# 39. Important Product Rule

PrescriptionMate BD should **not be presented as an AI doctor**.

The system's primary role is:

> **Helping users organize, understand and manage information from their prescriptions and medication routines.**

AI can assist with:

* Extraction
* Structuring
* Explanation
* Data organization

But medication changes, diagnosis and other clinical decisions should remain under appropriate human/clinical oversight.

---

# 40. Final Goal

The first version does **not** need to contain every planned feature.

The goal of the MVP is to build one reliable core experience:

```text
Prescription
     ↓
Medicine
     ↓
Schedule
     ↓
Reminder
     ↓
Dose
     ↓
Adherence
```

Once this foundation is stable, every future feature can connect to it.

### Final Product Evolution

```text
MVP
 ↓
Prescription & Medication Manager
 ↓
Family Care Platform
 ↓
Health Record Assistant
 ↓
Healthcare Services Platform
 ↓
PrescriptionMate BD SaaS
```

**Start simple. Build the core correctly. Then expand the platform module by module.**
