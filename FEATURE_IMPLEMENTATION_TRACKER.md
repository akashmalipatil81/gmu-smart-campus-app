# Feature implementation tracker

Status legend: IMPLEMENTED = code added; NOT VERIFIED = not executed in this environment; BLOCKED = requires external setup/integration.

| Feature | Status | Notes |
|---|---|---|
| Shared Student/Admin sign-in | IMPLEMENTED / BUILD VERIFIED | One login page selects student or administrator; the admin API enforces the selected role |
| Student registration with university ID/email | IMPLEMENTED / NOT VERIFIED | Spring Boot endpoint; password BCrypt-hashed |
| Student/Faculty/Admin roles | IMPLEMENTED / NOT VERIFIED | Exactly three role values |
| Faculty account creation by Admin | IMPLEMENTED / NOT VERIFIED | Admin endpoint and UI |
| Admin user activation/deactivation | IMPLEMENTED / NOT VERIFIED | Admin endpoint and UI |
| JWT bearer authentication | IMPLEMENTED / NOT VERIFIED | HMAC-SHA256 token, 8-hour expiry |
| Clubs browse/create/edit/delete | IMPLEMENTED / NOT VERIFIED | Admin manages; assigned faculty can edit description |
| Club membership request | IMPLEMENTED / NOT VERIFIED | Pending request saved; no immediate membership |
| Club request approval/rejection | IMPLEMENTED / NOT VERIFIED | Assigned coordinator or Admin; student notification |
| Library reservation requests | IMPLEMENTED / TESTS VERIFIED | Students submit requests; admins approve/reject; pending and confirmed requests prevent conflicts; students are notified |
| Library booking cancellation/history | IMPLEMENTED / NOT VERIFIED | Student own booking / Admin cancellation |
| Events and capacity-limited registration | IMPLEMENTED / NOT VERIFIED | Basic create/edit/delete/register endpoints |
| Project proposals and review | IMPLEMENTED / NOT VERIFIED | Student submits; Faculty/Admin approves/rejects |
| Project join requests and tasks | IMPLEMENTED / NOT VERIFIED | Team lead/supervisor decision and basic task progress |
| Notifications | IMPLEMENTED / NOT VERIFIED | In-app records; no email/SMS delivery |
| Announcements | IMPLEMENTED / NOT VERIFIED | Faculty/Admin publish; users read |
| Academic records | IMPLEMENTED / NOT VERIFIED | Basic manual records; no official SIS integration |
| PostgreSQL profile | IMPLEMENTED / NOT VERIFIED | Docker Compose + Spring profile |
| Default local persistent database | IMPLEMENTED / NOT VERIFIED | H2 file database |
| React frontend build | VERIFIED | `npm.cmd run build` completed successfully |
| Java backend compilation/runtime | BUILD AND TESTS VERIFIED | Maven tests pass; live application runtime was not started |
| Production security review | BLOCKED | Requires deployment configuration, secret management, tests and security review |
| Android app | NOT STARTED | Intentionally deferred until website is validated |


## Authentication compatibility revision (2026-11-16)

- Restored the original v3 Aadhaar-based login/registration contract in the React frontend and Java backend.
- Ported the exact Verhoeff D/P tables and input normalization rule (remove spaces and hyphens); validation requires 12 digits with first digit 2–9 and checksum result 0.
- Passwords use BCrypt cost 12, matching the original Express implementation.
- JWT retains HS256, `sub` and `role` claims, and 8-hour expiry. `/api/auth/me` restores the current user from the bearer token; disabled accounts are rejected.
- API responses expose only `aadhaarMasked`, never the full Aadhaar value.
- This checksum check is not UIDAI authentication or proof of identity.


### Authentication regression checks

- `AadhaarValidator.java` compiled with Java 21 and was exercised using a synthetic checksum-valid test fixture.
- Verified normalization of spaces/hyphens, valid Verhoeff checksum acceptance, invalid checksum rejection, first-digit/length rejection, and masked output.

### Admin sign-in and library reservation verification (2026-11-19)

- React/TypeScript production build completed successfully.
- Maven test suite passed: 8 tests, including reservation submission, overlap handling, and admin approval/rejection.
- The backend application was not started for an end-to-end runtime test.
