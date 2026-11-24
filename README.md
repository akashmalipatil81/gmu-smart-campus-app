# GMU Smart Campus Management System

This is the revised Java OOP backend + React frontend version of the uploaded `gmu-smart-campus-v3.zip`.

## What was changed

- Replaced the Node.js/Express backend with Java 21-compatible Spring Boot and Spring Data JPA.
- Restored the original v3 Aadhaar-based login and registration algorithm in Java: normalization (remove spaces/hyphens), 12-digit format check (first digit 2–9), Verhoeff checksum, BCrypt password hashing (cost 12), HS256 JWT with an 8-hour expiry, `/auth/me` token restoration, and inactive-account checks.
- Aadhaar is masked in API responses and UI; the raw number is used only for server-side lookup. This is local format/checksum validation, not UIDAI identity authentication.
- Kept exactly three roles: `student`, `faculty`, `admin`.
- Added student-led clubs. A student can create and host a club, review its members and approve/reject membership requests; faculty coordinators and admins retain their existing management access.
- Added a Student/Admin account selector to the shared sign-in page; administrator sign-in is server-restricted to admin accounts.
- Student library reservations are submitted as pending requests. Administrators can approve or reject them from the Library tab; students receive an in-app notification with the decision.
- Retained and connected the React modules for clubs, events, library and projects.
- Added notification, announcement and academic-record pages/APIs.
- Added file-backed H2 persistence for a simple local first run and an optional PostgreSQL profile with Docker Compose.

## Requirements

- Java 21 or newer (Java 26 may work, but Java 21 is the project's target).
- Node.js 20 or newer and npm.
- Internet connection for the first run to download Maven (if Maven is not installed) and project dependencies.

## Quick start on Windows

1. Extract this ZIP.
2. Open the extracted `GMU-Smart-Campus-Final` folder in VS Code.
3. Double-click `START-GMU-SMART-CAMPUS.bat`.
4. The first backend start downloads Apache Maven 3.9.9 locally if the `mvn` command is not already installed, then Maven downloads Java dependencies.
5. The frontend installs npm packages on its first start.
6. Open `http://localhost:5173`.

If Windows blocks the scripts, open PowerShell in the extracted folder and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\backend\run-backend.ps1
```

In a second terminal:

```powershell
.\frontend\run-frontend.ps1
```

## Administrator sign-in and initial account

Open `http://localhost:5173/login` and choose **Student** or **Admin** on the shared sign-in page. The old `/admin/login` URL redirects to this page. The first administrator is seeded only when `APP_ADMIN_AADHAAR` contains a 12-digit number passing the same Verhoeff checksum used by the original v3 login algorithm and `APP_ADMIN_PASSWORD` is set. Configure these in the same PowerShell terminal before the first backend start. The app does not ship with hard-coded administrator credentials:

```powershell
$env:APP_ADMIN_AADHAAR="your-valid-Aadhaar-number"
$env:APP_ADMIN_PASSWORD="YourStrongPassword123"
$env:JWT_SECRET="replace-with-a-long-random-secret-value-at-least-32-characters"
.\backend\run-backend.ps1
```

Student registration is self-service. Faculty accounts are created by Admin from Admin → Users and also require Aadhaar details. The admin Aadhaar is not printed in full. Do not commit actual Aadhaar numbers or passwords to source control.

## Database

### Default local mode

The application uses an H2 file database stored under `backend/data/`. Data persists across restarts. No separate database installation is required for this mode.

On an empty database, the app adds sample clubs, library seats, future events and announcements for demonstration. Existing records are preserved; sample events and announcements are seeded only when their respective lists are empty.

### PostgreSQL mode

Docker Desktop is required. From the project root:

```powershell
docker compose up -d
```

Or run `backend\run-postgres.ps1` from the project root to start Docker Compose and the backend with the PostgreSQL profile. To configure it manually, start the backend with the PostgreSQL profile (in a separate PowerShell terminal):

```powershell
$env:SPRING_PROFILES_ACTIVE="postgres"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/gmu_smart_campus"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
.\backend\run-backend.ps1
```

The frontend uses `/api` and Vite proxies API requests to `http://localhost:4000`.

## Approval workflows

- Club membership: Student hosts a club or requests to join another → that club's host/faculty coordinator/admin reviews → approve/reject → student receives notification.
- Library reservations: Student selects seat/date/time → backend checks availability and creates a pending request → Admin approves/rejects → student receives an in-app notification. Pending requests hold the seat/time to prevent conflicting requests. Overlapping requests and more than one request per student/date are rejected. Library hours are 08:00–22:00 and max duration is 4 hours.
- Project collaboration: Student publishes a project with required skills → Faculty/Admin reviews → approved project accepts join requests with applicant skill details → team lead or supervisor accepts/rejects → applicant is notified.
- Event registration: Student registers → backend checks capacity and duplicate registration → registration is confirmed automatically.

## Important limitations

This is a local development build, not a production university deployment. The academic module stores records entered by authorized faculty/admin; it is not connected to GM University's official SIS/LMS. Email/SMS delivery, password-reset email, QR check-in, file uploads, timetable import and external university integrations require additional configuration and are not represented as live integrations here. The current frontend is retained from the supplied ZIP and extended; it is not a pixel-perfect recreation of the separate GMU Connect screenshots.

Review `FEATURE_IMPLEMENTATION_TRACKER.md` for implementation status and testing limitations.


## Authentication algorithm preserved from original v3

The login flow intentionally keeps the original Aadhaar username algorithm instead of replacing it with university ID/email login:

1. The browser removes spaces and hyphens from the entered Aadhaar value.
2. The backend repeats normalization and validates exactly 12 digits, first digit 2–9, and the original Verhoeff checksum tables.
3. The backend looks up the account by that normalized Aadhaar value.
4. Passwords are verified using BCrypt, cost factor 12, matching the original Node `bcrypt.hash(password, 12)` flow.
5. Successful login issues an HS256 JWT with `sub` and `role` claims and an eight-hour expiry.
6. The frontend stores the token under `gmu_token`; startup calls `/api/auth/me` to restore the signed-in user.
7. Disabled accounts are rejected. Public API responses show only `XXXX XXXX` plus the last four digits.

**Privacy/security note:** Verhoeff is only a checksum/format test; it does not authenticate an Aadhaar holder or contact UIDAI. Aadhaar is sensitive personal information. Use synthetic test data while developing; before any real deployment, obtain appropriate consent and implement encryption, strict access controls, retention limits and applicable legal/security review.

If you ran an earlier revised build that created `backend/data/gmu-campus.mv.db` with university-ID accounts, back up that file before testing the Aadhaar-login revision. Those old accounts do not contain the original Aadhaar credentials and cannot be converted automatically. For a clean test database, stop the backend, back up and then remove `backend/data/gmu-campus.mv.db`; the next start will create a fresh schema and seed the admin from the environment variables above.
