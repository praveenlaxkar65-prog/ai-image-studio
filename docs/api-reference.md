# ai-image-studio — API Reference

> **Note on accuracy:** this doc was written to match the endpoint shapes assumed while building the frontend (user app + admin app). It reflects what the frontends *call*, not a verified backend contract. Cross-check each route against the actual Express route files before treating this as final — flag any mismatches and they're a quick fix on either side.

---

## 1. Base URLs

| Environment | User/Public API | Admin API |
|---|---|---|
| Local dev | `http://localhost:5000/api` | `http://localhost:5000/api/admin` |
| Production | `https://api.<your-domain>.com/api` | `https://api.<your-domain>.com/api/admin` |

Set via `VITE_API_BASE_URL` in each frontend's `.env`.

## 2. Authentication

Two independent auth namespaces — a user JWT and an admin JWT. They are **not interchangeable**.

| | User app | Admin app |
|---|---|---|
| Token storage key (localStorage) | `ais_token` | `ais_admin_token` |
| Header | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` |
| Obtained from | `POST /auth/login`, `POST /auth/signup` | `POST /admin/login` |

If a request returns `401`, the frontend clears the relevant token and redirects to the matching login page.

## 3. Standard response shapes

**Success**
```json
{
  "success": true,
  "data": { /* endpoint-specific */ }
}
```
*(Some endpoints return the payload unwrapped, e.g. `{ "token": "...", "user": {...} }` directly — see each section below for what's actually expected.)*

**Error**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## 4. Common error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed validation |
| 401 | `UNAUTHORIZED` | Missing/expired/invalid token |
| 402 | `INSUFFICIENT_CREDITS` | User doesn't have enough credits for this action |
| 403 | `FORBIDDEN` | Authenticated but not allowed (e.g. banned user, non-admin) |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | e.g. duplicate email on signup |
| 422 | `MODERATION_BLOCKED` | Content rejected by the Safety Layer |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

---

## 5. Auth — `/auth`

### `POST /auth/signup`
Create a new user account.

**Body**
```json
{ "name": "Jordan Lee", "email": "jordan@example.com", "password": "minimum8chars" }
```

**Response `200`**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "u_123", "name": "Jordan Lee", "email": "jordan@example.com", "credits": 10 }
}
```

### `POST /auth/login`
**Body:** `{ "email": "...", "password": "..." }`
**Response:** same shape as signup.

### `GET /user/profile`
Returns the current user, used on app load to restore a session from a stored token.

**Response `200`**
```json
{ "user": { "id": "u_123", "name": "Jordan Lee", "email": "jordan@example.com", "credits": 42 } }
```

---

## 6. User — `/user`

| Method | Path | Body | Notes |
|---|---|---|---|
| `PATCH` | `/user/profile` | `{ "name": "..." }` | Update profile fields |
| `POST` | `/user/change-password` | `{ "currentPassword", "newPassword" }` | |
| `GET` | `/user/gallery` | — query: `?limit=6` | Returns `{ "projects": [...] }` |
| `DELETE` | `/user/gallery/:id` | — | Delete a saved project |

**Project object shape**
```json
{
  "id": "p_1",
  "name": "sunset-edit",
  "url": "https://.../sunset-edit.png",
  "thumbnailUrl": "https://.../sunset-edit_thumb.png",
  "toolName": "Upscale",
  "category": "AI Edit",
  "createdAt": "2026-06-20T10:00:00Z"
}
```

---

## 7. Tools — `/tools`

### `GET /tools`
Returns the admin-configured tool catalog (zero-hardcode — this is the source of truth the frontend renders from).

**Response**
```json
{
  "categories": [
    {
      "id": "ai-edit",
      "label": "AI Edit",
      "tools": [
        { "slug": "bg-remove", "name": "Background Remove", "description": "...", "credits": 3, "enabled": true, "provider": "stability" }
      ]
    }
  ]
}
```

### `POST /tools/:slug/run`
Executes a tool job. *(Not yet wired into the frontend tool pages — placeholder UI exists at `/tools/:slug` pending this.)*

**Body:** `multipart/form-data` — `image` file + tool-specific params (e.g. `width`, `height` for resize).

**Response `202`** (async job)
```json
{ "jobId": "j_456", "status": "queued" }
```

### `GET /tools/jobs/:jobId`
Poll job status.

**Response**
```json
{ "jobId": "j_456", "status": "completed", "resultUrl": "https://.../result.png" }
```
`status` ∈ `queued | processing | completed | failed`.

---

## 8. Prompt Studio — `/prompt-studio`

### `POST /prompt-studio/command`
Chat-based editing. Accepts a natural-language instruction plus an optional source image; the Agentic Layer (commandParser + stepPlanner) interprets it and routes to the right tool(s).

**Body:** `multipart/form-data`
- `prompt` (string, required)
- `image` (file, optional — omitted on follow-up messages in the same thread)
- `threadId` (string, optional — for multi-turn context)

**Response `200`**
```json
{ "message": "Done — background removed and slightly upscaled.", "resultUrl": "https://.../result.png", "creditsUsed": 4 }
```

If the instruction can't be resolved to a tool, expect `422` with `code: "MODERATION_BLOCKED"` or a clarifying message in `message` instead of a hard error — frontend should display it as an assistant chat bubble either way.

---

## 9. Wallet — `/wallet`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/wallet/packs` | Returns `{ "packs": [{ "id", "credits", "price", "popular" }] }` |
| `GET` | `/wallet/transactions` | Returns `{ "transactions": [{ "id", "type": "credit"\|"debit", "amount", "description", "createdAt" }] }` |
| `POST` | `/wallet/purchase` | Body: `{ "packId": "pack_m" }` → `{ "credits": 192 }` (new balance) after payment provider confirms |

Credit Engine uses an idempotency key per the backend summary — frontend should send an `Idempotency-Key` header on `/wallet/purchase` to avoid double-charging on retry (not yet implemented in the frontend; flagging for follow-up).

---

## 10. Admin — `/admin/*`

All routes below require the admin Bearer token and are mounted under `/api/admin`.

### Auth
| Method | Path | Notes |
|---|---|---|
| `POST` | `/admin/login` | `{ "email", "password" }` → `{ "token", "admin": { "id", "name", "email" } }` |
| `GET` | `/admin/profile` | Restore session |

### Tools config
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/tools` | — |
| `PATCH` | `/admin/tools/:slug` | `{ "enabled", "creditCost", "provider" }` |

### Providers
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/providers` | — |
| `POST` | `/admin/providers` | `{ "name", "type", "apiKey" }` |
| `PATCH` | `/admin/providers/:id` | `{ "active": true\|false }` |
| `DELETE` | `/admin/providers/:id` | — |

`apiKey` is encrypted at rest (per Encryption util in backend Utils layer). `GET` responses should mask all but the last 4 characters server-side, not just on the frontend.

### Pricing
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/pricing/packs` | — |
| `POST` | `/admin/pricing/packs` | `{ "credits", "price", "popular" }` |
| `PATCH` | `/admin/pricing/packs/:id` | same fields, partial |
| `DELETE` | `/admin/pricing/packs/:id` | — |

### Storage
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/storage/config` | — |
| `PUT` | `/admin/storage/config` | `{ "adapter": "s3"\|"r2"\|"local", "bucket", "region", "accessKeyId", "secretAccessKey", "endpoint", "autoDeleteHours" }` |

`autoDeleteHours` defaults to `12` (per project notes) — drives the Storage Manager's cleanup job.

### Moderation
| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/moderation/flags?status=pending` | Returns `{ "flags": [{ "id", "url", "thumbnailUrl", "reason", "userId", "userEmail" }] }` |
| `POST` | `/admin/moderation/flags/:id/approve` | Releases the flagged content |
| `POST` | `/admin/moderation/flags/:id/reject` | Blocks content, should trigger a user notification |

### Users
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/users` | Returns `{ "users": [{ "id", "name", "email", "credits", "banned" }] }` |
| `PATCH` | `/admin/users/:id` | `{ "banned": true\|false }` |
| `POST` | `/admin/users/:id/credits` | `{ "delta": 10 }` (positive or negative) |

### Analytics
| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/analytics/summary` | `{ "totalUsers", "creditsSpentToday", "jobsToday", "pendingModeration" }` |
| `GET` | `/admin/analytics/jobs-series` | `{ "series": [{ "day", "jobs" }] }` (7 points) |
| `GET` | `/admin/analytics/tool-usage` | `{ "usage": [{ "tool", "count" }] }` |
| `GET` | `/admin/analytics/revenue-series` | `{ "series": [{ "day", "amount" }] }` (7 points) |

### System settings
| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/settings` | — |
| `PUT` | `/admin/settings` | `{ "platformName", "signupBonus", "maintenanceMode", "supportEmail" }` |

---

## 11. Credits & idempotency

Every credit-consuming endpoint (tool runs, Prompt Studio commands) should:
1. Check balance before starting a job (`402 INSUFFICIENT_CREDITS` if short).
2. Deduct atomically when the job is accepted, not when it completes — refund on failure.
3. Accept an `Idempotency-Key` header so a retried request (e.g. flaky network) doesn't double-charge.

This matches the backend's Credit Engine description ("with idempotency") — the exact header name/contract should be confirmed against the actual implementation and updated here.

## 12. Open items / to confirm against real backend

- Exact wrapper shape (`{ success, data }` vs unwrapped) — frontends currently handle both defensively (`res.data?.x ?? res.data`), but locking this down removes a class of bugs.
- Whether job polling (`GET /tools/jobs/:jobId`) or webhooks/SSE is the real mechanism for async tool runs.
- Idempotency header name for `/wallet/purchase` and tool-run endpoints.
- Pagination shape for `/user/gallery`, `/admin/users`, `/admin/moderation/flags` (currently assumed un-paginated).
