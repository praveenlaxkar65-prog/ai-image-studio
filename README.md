# ai-image-studio

AI Image Editing Platform — multi-tool (Crop/Resize/BG-Remove/Upscale/Text-to-Image/etc.) + Prompt Studio (chat-based editing) + Credit system + Admin Panel (zero-hardcoding — everything provider/pricing/storage configurable from DB).

## Structure

```
ai-image-studio/
├── backend/            Node.js + Express + Supabase/PostgreSQL + Redis (BullMQ)
├── frontend-user/      React + Vite + Tailwind — the public/user-facing app
├── frontend-admin/     React + Vite + Tailwind — the admin console
└── docs/
    └── api-reference.md
```

## Running locally

```bash
# 1. Backend
cd backend
npm install
npm run dev          # default: http://localhost:5000

# 2. User app
cd frontend-user
npm install
npm run dev          # default: http://localhost:5173

# 3. Admin app
cd frontend-admin
npm install
npm run dev          # default: http://localhost:5174
```

Each frontend reads `VITE_API_BASE_URL` from its own `.env` (defaults to
`http://localhost:5000/api` for the user app and
`http://localhost:5000/api/admin` for the admin app).

## Notes

- Storage auto-delete: 12 hours by default, admin-configurable (Storage page).
- Supabase used only as the database — not for Auth/Storage features.
- Both frontends are built to degrade gracefully: if a backend endpoint
  isn't reachable yet, pages fall back to local config or empty states
  instead of crashing, so the UI can be reviewed/tested independently of
  backend progress. See `docs/api-reference.md` → "Open items" for the
  exact assumptions made that should be verified against the real routes.
