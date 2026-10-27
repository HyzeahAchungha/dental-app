# Dental App — Implementation Plan

## 1. Spec Summary

**Product:** Multi-tenant dental clinic management and patient-care SaaS platform.

**Users / customers:**
- Paying customer: dental clinic (B2B), per-clinic subscription, free tier + paid tiers.
- End user: patient — one patient account, linkable to multiple clinics; each clinic sees only its own records for that patient.
- Staff: dentists, receptionists, clinic administrators — same Clerk account can be a patient at Clinic A and staff at Clinic B.

**Three experiences (v1):**
1. **Patient mobile app** (React Native, Expo, TypeScript, iOS + Android): registration, Apple/Google sign-in via Clerk, onboarding, clinic search/selection, dentist profiles, appointment booking (self-service), dental records, AI dental assistant, 1:1 audio/video consultations, push notifications with deep links.
2. **Dentist web portal** (Next.js App Router, TypeScript): schedules, appointments, patient info, consultations, follow-up instructions.
3. **Clinic admin web dashboard** (Next.js App Router, TypeScript): clinic setup, staff/dentist management, patient management, service/pricing management, bookings, business reporting.

**Core flows (v1):**
- Clinic owner registers via web dashboard → creates clinic workspace → invites staff by email → configures services, pricing, schedules.
- Patient discovers clinic via search or invitation code → links to clinic → onboarding (required: name, DOB, email/phone, clinic, terms; optional: reason for visit, dental history, allergies, medical conditions, medications, previous treatment, preferred times, goals, emergency contact, notes; "I don't know" allowed) → dentist sees submitted onboarding data before first visit.
- Patient self-books appointment (service, dentist, time slot) → pending status → clinic confirms/rejects → patient can cancel/request reschedule per clinic rules. Staff-created appointments on behalf of patients: pending confirmation (not yet approved for v1). Booking system prevents overlapping dentist appointments: enforces service duration and per-clinic buffer time between appointments, serializes concurrent booking attempts with row-level locking/transactions, and frees slots on cancellation or rejection.
- Confirmed appointment with video need → backend provisions Stream 1:1 call → server-issued token → patient + dentist join; no recording by default; phone consult/reschedule fallback if Stream unavailable.
- AI dental assistant: general oral-care education + booking assistance only; explicit "not medical advice" disclaimer on every interaction; no diagnosis/prescription; urgent-symptom detection triggers safe escalation to human support or emergency care guidance; provider outage shows temporary-unavailability message and offers booking assistance or human support; patient data sent to AI is minimized, de-identified where possible, and reviewed against the AI provider's data handling before any identifiable health information is transmitted.
- Clinical staff create dental records and treatment plans (stricter role-based access). Prescriptions: pending confirmation (not yet approved for v1). Receptionists see role-limited info only.

**Appointment calendar:**
- Built-in calendar for dentists, clinic administrators, and patients with daily, weekly, and monthly views.
- Dentist availability: working hours, breaks, leave, and blocked slots stored per clinic/timezone.
- Calendar reflects confirmed and pending appointments; cancelled or rejected appointments release slots immediately.
- Filtering by dentist, service, date range, and clinic.
- Timezone handling: appointment times stored in UTC; displayed and booked in each clinic's timezone with consistent availability after any appointment change.

**Out of scope (v1):** group/family calls, support-call video, biometric auth, SMS notifications, video recording, offline writes with conflict resolution, payment processor integration (invoices tracked only), trial logic (not decided), exact free-vs-paid feature gating.

**Data model (core entities):**
- User identity: id (shared across clinics), email, phone, Clerk subject id, auth metadata
- Patient profile: id, user id, name, DOB, phone, email, onboarding answers, consent records
- Clinic: id, name, address, phone, email, logo, branding, status, timezone
- ClinicSubscription: id, clinic id, subscription status (active/past_due/canceled/expired), tier identifier, billing-provider reference (when applicable), current period start, current period end, cancel at period end, created at, updated at
- ClinicMembership: id, user id, clinic id, role (owner/admin/dentist/receptionist/patient), unique(user id, clinic id)
- Dentist: id, clinic id, name, license number, specialization, contact, working hours, breaks, leave, blocked slots, availability
- Appointment: id, patient id, dentist id, clinic id, service id, start datetime (UTC), end datetime (UTC derived from service duration + buffer), status, notes; PostgreSQL exclusion constraint on dentist time slots (including buffer) prevents overlapping active appointments; buffer time stored per clinic/service; cancelled and rejected appointments release their time slots; server-side booking-conflict validation on every create/update
- Service: id, clinic id, name, description, price, duration, buffer time after appointment
- ClinicEntitlement: id, clinic id, feature key, enabled, value/limit (configurable, separate from subscription status)
- ClinicUsage: id, clinic id, metric key, period start, period end, count (dedicated usage tracking where needed)
- DentalRecord: id, patient id, clinic id, record type, clinical notes, attachments, author, timestamp (UTC), version history
- TreatmentPlan: id, patient id, clinic id, dentist id, proposed treatment, status, follow-up date, version history
- Prescription: id, patient id, clinic id, dentist id, medication details, instructions, issue date — pending confirmation
- Invoice: id, patient id, clinic id, appointment id, amount, currency, payment status — payment-status tracking only, no payment gateway in v1
- VideoCall: id, appointment id, Stream call id, participants, start/end, status
- Notification: id, clinic id, recipient, type, content, status, sent at

**Database standards:** version-controlled migrations; foreign keys on all relationships; indexes on clinic-scoped queries and lookup fields; transactions with row-level locking for multi-table writes (especially booking); PostgreSQL exclusion constraints on dentist time slots to prevent overlap including buffer time (standard UNIQUE constraints do not prevent overlapping ranges); duplicate-membership uniqueness constraints; all timestamps stored in UTC with each clinic's timezone retained for display.

**Auth / Authz:** Clerk proves identity; DB-backed roles + clinic membership determine access. Server-side authorization is enforced on every protected request. Cross-clinic access is prevented even if clinic IDs are changed or guessed. Database credentials and Stream signing secrets are never exposed to clients. Subscription and entitlement infrastructure is prepared (ClinicSubscription, ClinicEntitlement, ClinicUsage entities linked to the clinic) without inventing prices, trial periods, or feature limits; subscription enforcement is disabled until pricing, trial rules, and feature limits are approved; no payment processing is implemented until the billing provider and requirements are approved.

**Permissions matrix (v1):**
- Clinic owner: full clinic management (profile, staff, services, pricing, schedules); can invite and revoke staff; manage own clinic's appointments and records; clinical-record access only where explicitly authorized and required by their responsibilities.
- Clinic administrator: clinic management and staff management; can create and edit appointments; view all clinic patients; clinical-record access only where explicitly authorized and required by their responsibilities.
- Dentist: manage own schedule; view and create records/treatment plans for patients linked to their clinic under their authorized care; join video consultations; view own appointments; no access to other clinics' data or other dentists' patients' records unless authorized.
- Receptionist: view patients and appointments; create/edit appointments (pending confirmation); view limited patient info (name, contact, appointment details); no access to clinical notes, treatment plans, or prescriptions by default.
- Patient: view own profile and onboarding data; book and self-manage own appointments; view only their own authorized clinical records; cannot create, edit, or delete official clinical records; join own video consultations; use AI assistant; no access to other patients or clinic staff data.

**Least-privilege clinical-record access:**
- DentalRecord and TreatmentPlan: read/write restricted to dentists and clinic administrators for patients linked to their clinic under authorized care; receptionists cannot access clinical notes, treatment plans, or prescriptions by default; patients can view only their own authorized clinical records and cannot create, edit, or delete official clinical records.
- Clinic administrators access clinical records only where explicitly authorized and required by their responsibilities.
- Prescriptions: same least-privilege rules as DentalRecord/TreatmentPlan (pending confirmation).
- Every clinical-record read/write is audited (who, what, clinic, when, before/after values for changes).
- Preserve clinical-record history (versioned DentalRecord and TreatmentPlan).

**Clinical-data safeguards:**
- Audit sensitive record access and changes (who, what, clinic, when).
- Review AI-provider data handling before sending any identifiable health information; AI limited to general dental education and booking assistance with safe escalation for urgent concerns.
- Document consent, retention, deletion, and access-control requirements for launch countries before production.

**Architecture:**
- Next.js App Router web dashboard + REST/JSON API consumed by Expo mobile app
- Shared TypeScript service modules (booking, clinic management, patient relationships)
- Neon PostgreSQL, server-side access only
- Inngest (or equivalent durable job system) for async jobs with retries/idempotency
- ImageKit for image optimization/delivery
- GetStream.io for 1:1 video calls
- Sentry for error monitoring (email alerts to developer, no paging v1)
- Expo Notifications for push (no PHI on lock screen); deep links to appointment screens
- Email provider TBD; SMS deferred post-MVP

## 2. ASSUMPTIONS

1. Clinic owner/admin registers themselves via the web dashboard (no manual clinic onboarding).
2. Patients link via clinic search + optional invitation code; one patient account, multiple clinic links; per-clinic record visibility.
3. Trial logic deferred; free tier + paid per-clinic subscription available at launch.
4. SMS provider not selected; SMS deferred to post-MVP.
5. Email provider not selected; background jobs handle email delivery retries.
6. Initial launch-country list not determined; HIPAA/GDPR/PIPEDA compliance to be assessed per country at launch.
7. Neon hosting region not selected.
8. Inngest selected as the durable job system (or equivalent).
9. No video recording by default; recording deferred pending consent/privacy review.
10. Biometric auth deferred to v2.
11. Minimal offline caching only; bookings and clinical writes require connectivity; no offline-write conflict resolution in v1.
12. Sentry alerts via email to developer only; no dedicated on-call paging in v1.
13. AI provider is a general-purpose LLM API (not specified); token budget and cost limits TBD.
14. Invoice/payment tracking is records-only in v1; no payment processor (e.g., Stripe) integrated.
15. Audit trails cover sensitive access and changes; granularity and retention period TBD.

## 3. OPEN QUESTIONS / UNRESOLVED DECISIONS

The following items remain unresolved. No answers have been invented; they must be confirmed before production launch.

1. **Launch countries** — not listed; HIPAA/GDPR/PIPEDA applicability, BAAs, data-residency, and consent flows must be assessed per country.
2. **Neon hosting region** — not selected; affects data residency and latency.
3. **Email provider** — not selected; affects notification delivery and cost.
4. **SMS provider** — not selected; SMS deferred to post-MVP.
5. **AI provider** — unspecified; token budget, cost model, medical-disclaimer implementation, temporary-unavailability fallback, human-support escalation need definition.
6. **AI data handling** — must be reviewed before sending any identifiable health information to the AI provider.
7. **Payment processing** — no payment gateway in v1; invoices are payment-status tracking only; monetization gating (free vs paid) not yet defined.
8. **Free-vs-paid feature limits** — per-clinic subscription tier boundaries not defined.
9. **Stream call duration/pricing limits** tied to subscription not yet priced.
10. **"I don't know" onboarding answers** — how dentists interpret missing clinical data needs a display convention.
11. **Audit trail granularity and retention** not defined.

## 4. Implementation-Ready Task List

### Phase 0 — Project setup & infra
- [ ] Initialize repo structure: Next.js (web) + Expo (RN) + shared TypeScript services package
- [ ] Configure Neon PostgreSQL; create initial schema (Clinic, ClinicSubscription, ClinicEntitlement, ClinicUsage, ClinicMembership, Dentist, Patient, Appointment, Service, DentalRecord, TreatmentPlan, Prescription, Invoice, VideoCall, Notification)
- [ ] Configure Clerk (Apple + Google auth); set up Clerk SDK in web and mobile
- [ ] Configure ImageKit for image upload/optimization
- [ ] Configure GetStream.io video SDK; server-side call token issuance
- [ ] Configure Sentry DSN in web and mobile; exclude PII/PHI from logs
- [ ] Add subscription/entitlement schema (ClinicSubscription, ClinicEntitlement, ClinicUsage entities linked to clinic) behind a feature flag, disabled by default; no prices, trial periods, or feature limits defined yet
- [ ] Configure Inngest (or equivalent) for durable background jobs
- [ ] Configure Expo Notifications; FCM/APNs credentials
- [ ] CI/CD pipeline (lint, typecheck, build checks)

### Phase 1 — Auth, multi-tenancy, clinic onboarding
- [ ] Clerk auth integration (sign-in/sign-up, Apple/Google, session management)
- [ ] Server-side authorization middleware: Clerk identity → DB role + clinic membership → enforce clinic-level data isolation on every request
- [ ] Clinic owner registration flow (web): create account → clinic workspace → owner membership
- [ ] Staff invitation flow (web): email invite → accept → assign role
- [ ] Clinic profile/services/pricing/schedules CRUD (web dashboard)
- [ ] Authorization and tenant-isolation tests: verify each role can only access permitted clinics/resources; verify cross-clinic access is blocked even with forged IDs (must pass before protected clinic and patient features)

### Phase 2 — Patient onboarding & mobile app core
- [ ] Patient registration/login (mobile): Clerk Apple/Google + email
- [ ] Clinic discovery: search + optional invitation code
- [ ] Patient-clinic linking: one account, multiple clinics; per-clinic record access
- [ ] Patient onboarding form: required + optional fields; "I don't know" option; consent capture
- [ ] Patient profile/dental records view (mobile)
- [ ] Dentist profiles view (mobile)

### Phase 3 — Appointments
- [ ] Appointment booking (mobile): patient selects service, dentist, time slot → pending status; enforces service duration + buffer time; serializes concurrent booking attempts with row-level locking; server-side booking-conflict validation
- [ ] Staff-created appointments (web dashboard): book on behalf of patient (pending confirmation feature flag)
- [ ] Clinic confirm/reject appointment (web dashboard); frees slot on rejection
- [ ] Patient cancel/reschedule per clinic rules (mobile); frees slot on cancellation
- [ ] Appointment status polling (web dashboard); mobile refresh on reconnect
- [ ] Appointment list/views for patient, dentist, receptionist
- [ ] Concurrent-booking and overlap tests: prevent overlapping dentist appointments under simultaneous requests, including service duration, buffer time, and cancellation slot release
- [ ] Calendar views (daily/weekly/monthly), dentist availability, working hours, breaks, leave, blocked slots, timezone-consistent display, and slot consistency after appointment changes

### Phase 4 — Video consultations (GetStream.io)
- [ ] Backend provisions Stream 1:1 call when appointment confirmed + video needed
- [ ] Server-issued call tokens; authorized participants only
- [ ] Join video call from appointment screen (mobile + web)
- [ ] Fallback UI: phone consult / reschedule when Stream unavailable
- [ ] Recording disabled by default; no recording UI in v1

### Phase 5 — AI dental assistant
- [ ] AI chat interface (mobile): general oral-care Q&A + booking assistance
- [ ] "Not medical advice" disclaimer on every AI interaction
- [ ] Urgent-symptom detection: safe escalation to human support or emergency care guidance
- [ ] No diagnosis/prescription logic; refusal + human-support escalation path
- [ ] Provider-outage handling: temporary-unavailability message; offers booking assistance or human support
- [ ] Patient-data protection: minimize and de-identify data sent to AI; review AI provider data handling before transmitting any identifiable health information

### Phase 6 — Clinical records & prescriptions
- [ ] Dental record creation (dentist, web + mobile): record type, notes, attachments, author, timestamp
- [ ] Treatment plan creation (dentist): proposed treatment, status, follow-up date
- [ ] Prescription creation (dentist): medication details, instructions, issue date (pending confirmation feature flag)
- [ ] Least-privilege access: dentists and clinic administrators read/write records for linked patients under authorized care only; receptionists cannot access clinical notes, treatment plans, or prescriptions by default; patients view only their own authorized records and cannot create, edit, or delete official clinical records
- [ ] Audit every clinical-record read/write (who, what, clinic, when, before/after values)
- [ ] Patient view of their own records (mobile)

### Phase 7 — Notifications & async jobs
- [ ] Inngest jobs: appointment confirmations, reminders, follow-ups
- [ ] Expo push notifications for appointment reminders (no PHI on lock screen)
- [ ] Deep links: notification tap → appointment screen
- [ ] Email notifications via background jobs with retry (provider TBD)
- [ ] Notification entity: track status, sent at, failures

### Phase 8 — Invoices & billing records
- [ ] Invoice creation tied to appointment: amount, currency, payment status (records only)
- [ ] Invoice list/views (clinic dashboard + patient mobile)
- [ ] ClinicSubscription schema (status, tier identifier, billing-provider reference, lifecycle timestamps) linked to clinic; ClinicEntitlement and ClinicUsage entities configured but enforcement disabled until pricing, trial rules, and feature limits approved; no payment processing implemented until billing provider and requirements approved

### Phase 9 — Testing, observability, security, hardening
- [ ] Unit tests for service modules
- [ ] Integration tests for booking flows and clinic-scoped data access
- [ ] Booking-concurrency and overlap tests: prevent overlapping dentist appointments under simultaneous requests, including service duration, buffer time, and cancellation slot release
- [ ] Least-privilege clinical-record tests: verify dentists/administrators can access linked patients' records only under authorized care; receptionists and patients cannot create or edit clinical records; cross-clinic record access blocked
- [ ] Audit-trail tests: verify sensitive record access and changes are logged (who, what, clinic, when, before/after values)
- [ ] Failed-write and duplicate-job tests: confirm nothing shows as successful before server confirmation
- [ ] Unavailable-service tests: Stream, Clerk, Neon, ImageKit, AI provider fallback behavior; AI provider outage shows temporary-unavailability message and offers booking assistance or human support
- [ ] Sentry error tracking (web + mobile); sanitize PII/PHI from logs
- [ ] Audit trails for sensitive access/changes (who, what, clinic, when)
- [ ] Rate limiting on auth and booking endpoints
- [ ] Encryption in transit (TLS) and at rest (Neon); least-privilege DB roles
- [ ] Secure logout: clear cached sensitive data on mobile
- [ ] Automated backups and recovery procedures; backup-restoration tests

### Phase 10 — Deployment and operations
- [ ] Separate development, staging, and production environments
- [ ] Separate credentials and databases per environment where appropriate
- [ ] CI checks: lint, type-checking, tests, builds on every change
- [ ] Document deployment, migrations, rollback, and recovery procedures
- [ ] Idempotent notification jobs (safe to retry)
- [ ] E2E critical-path validation: clinic onboarding → patient onboarding → booking → confirmation → video call → AI chat → record creation
- [ ] Compliance pre-launch review: confirm launch countries, Neon region, vendor DPAs/BAAs, consent flows
- [ ] Subscription enforcement remains disabled until pricing, trial rules, and feature limits approved; no payment processing until billing provider and requirements approved
- [ ] Production deploy: web (Vercel or equivalent), mobile (Expo EAS/Store), Neon production database

## 5. Definition of Done (v1)
- Authorization and tenant-isolation tests pass for all roles (required before protected clinic and patient features).
- Booking-concurrency and overlap tests pass: no overlapping dentist appointments including concurrent bookings, service duration, buffer time, and cancellation slot release.
- Verified backup restoration (backup-restoration tests pass).
- Secrets and sensitive data handled securely (no database credentials or Stream signing secrets exposed to clients; no PHI in logs).
- Vendor and country compliance review completed before production.
- Clinic can onboard, invite staff, configure services/pricing/schedules with strict data isolation.
- Patient can register, link to clinic(s), complete onboarding, self-book appointment, view status, cancel/reschedule.
- Clinic staff can confirm/reject bookings and manage schedules; create records/treatment plans (prescriptions pending confirmation); overlapping dentist appointments prevented including concurrent bookings, service duration, buffer time, and cancellation slot release; calendar views consistent with availability after appointment changes.
- Clinical-record least-privilege enforced server-side: dentists and admins access linked patients' records under authorized care only; receptionists cannot access clinical notes/treatment plans/prescriptions by default; patients view only their own authorized records and cannot create/edit/delete official records.
- 1:1 video call works for confirmed appointments with server-issued tokens; phone fallback when Stream down.
- AI assistant answers general questions + booking help with disclaimer, urgent-symptom safe escalation, provider-outage fallback, and patient-data minimization; no diagnosis.
- Push notifications + deep links for reminders; idempotent email retry via background jobs.
- Sentry monitoring active; no PHI in logs.
- Bookings require connectivity; minimal offline cache only.
- No payment gateway in v1; invoices are payment-status tracking only. Subscription/entitlement schema prepared but enforcement disabled until pricing, trial rules, and feature limits approved; no payment processing implemented.