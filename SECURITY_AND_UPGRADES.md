# Staff permissions, sessions and existing data

This application supports administrator and teacher staff accounts. Student documents are records, not login accounts; there is no student authentication portal.

| Operation | Administrator | Active teacher linked to a Teacher document |
| --- | --- | --- |
| Staff accounts and teacher linking | Manage | Own profile only |
| Students, classes and teachers | Read/manage | Read own teacher record, assigned classes and enrolled students |
| Enrollments and student profile mutations | Manage | Denied |
| Grades and publication | Manage | Own assigned classes and enrolled students |
| Grade deletion | Manage | Denied |
| Attendance, QR lookup and statistics | Manage | Assigned classes and their enrolled students |
| Fee CRUD, receipts and bulk generation | Manage | Denied |
| Current attendance fee indicator | Read | Assigned students; status only, no receipt amounts/details |

Class.teacher is the authoritative assignment; legacy name/email matches do not grant access. An administrator explicitly links an existing teacher account with `PUT /api/auth/users/:id/teacher-profile` and `{ "teacherProfile": "<Teacher ObjectId>" }`. Account sessions are revoked when this mapping changes. Unlinked/inactive teachers fail closed for class/student workflows. Queries and object routes apply scope in addition to route-level permissions. Responses filter references to classes/students outside the teacher assignment.

## Sessions and deployment configuration

Sessions use signed, expiring JWTs with MongoDB revocation records. The browser uses an HttpOnly cookie and does not persist JWTs or student/user records in local storage. Existing local-storage credentials are removed on startup. Existing API clients can use a newly issued session token as Bearer authorization. Legacy JWTs require sign-in again. Logout revokes the session; password changes require the current password and revoke prior sessions. Active-account and teacher status checks occur on requests.

Set an explicit comma-separated `ALLOWED_ORIGINS` and a random `JWT_SECRET` of at least 32 characters in production; wildcard CORS is rejected. Cookies require an allowed Origin for changes. Use HTTPS and preferably serve frontend/API on the same site. `SESSION_SAME_SITE` defaults to `lax`; a reviewed cross-site deployment can use `none` only with production Secure cookies and the explicit origin allowlist. Browser third-party-cookie restrictions may still require a same-site proxy. Login throttling is bounded and process-local; multi-instance deployments also need an ingress limit. Match `VITE_API_URL` to the actual API root. Never log tokens or SMTP configuration.

## Data-preserving upgrade

Back up and test restoration first. Retain the same database and collection names. No automatic seed, database drop, renumbering, deletion or role conversion runs on startup. Existing explicit roles/IDs remain. Newly created users default to teacher, and only administrators can register staff. Existing teachers need the explicit mapping above before accessing classes.

New Counter, AuthSession and EmailJob collections are additive. Human IDs initialize from the greatest existing numeric suffix and allocate atomically; gaps are allowed and deletions do not recycle IDs. Existing Student/Teacher/Class/Grade/Payment IDs remain. No bulk migration against real data is included or authorized. Check unique-index consistency and any historical malformed/duplicate IDs in an isolated restored copy before upgrading real data.

Grade publication and mark-paid actions preserve the first event timestamp on repeat/concurrent requests. Use the explicit state endpoints; editing `isPublished`, receipt identity or payment timestamps is rejected. Email/print template values are HTML-escaped. Publishing still requires a deliberate action; synthetic tests do not establish grading correctness or financial reconciliation.

Email intent is stored with the grade/payment update. A MongoDB outbox retries delivery with a lease and bounded exponential backoff, up to five attempts. Startup reconciles pending intent flags, so a crash between the domain write and queue creation can recover. No additional queue service is required. Retries verify that the grade remains published or the receipt remains paid at the same event timestamp. SMTP file/URL access is disabled and TLS is verified. A process crash after SMTP accepted a message but before the sent record commits can still cause duplicate delivery; this is not an exactly-once mail guarantee. Monitor failed jobs and review/requeue them deliberately. Retain job history privately; mail bodies contain student data. Live SMTP delivery is configuration-dependent.

`npm run demo`, `npm run seed` and `npm run seed:reset` now start only the disposable fictional demo. They ignore inherited database/SMTP settings and never reset existing data. Use `npm test` for a disposable MongoDB server. Existing example account passwords from older source must be rotated by the operator, with old sessions revoked, before exposing a real installation. `CreateAdminUser.txt` describes the explicit bootstrap utility; no reusable admin credential is shipped.

Rollback to a database backup if restoration is required; otherwise leave additive collections/fields intact. Restoring legacy authentication or broad teacher permissions would restore known weaknesses, so isolate a rolled-back server. Do not execute production migrations, account changes or deployment commands as part of this source review.
