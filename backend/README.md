# backend/

This folder is a **placeholder** in this generated bundle.

The actual backend (~67 files — DB migrations, config layer, provider-adapter
core, auth, credit engine, storage manager, safety layer, job queue,
notification service, analytics, agentic layer, all 23 tools, admin
controllers, users module, routes, utils, `app.js`) was built in an earlier
chat session and already exists in your own repo / GitHub.

**Action needed:** copy your existing `backend/` folder into this same
`ai-image-studio/` root so the final structure looks like:

```
ai-image-studio/
├── backend/          ← your existing, already-complete backend
├── frontend-user/     ← from this bundle
├── frontend-admin/    ← from this bundle
└── docs/              ← from this bundle
```

Nothing in `frontend-user/` or `frontend-admin/` needs the backend source
to exist at build time — they just need it **running** (`http://localhost:5000`
by default) so the API calls resolve instead of falling back to local/dummy
data.
