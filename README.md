# Gnoland Ecosystem

Public directory of projects building on gno.land.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3310. The first visit to `/admin` chooses the admin password. The hash stays in `data/auth.json` on that machine.

`data/store.json` and `data/submissions.json` are local runtime files and are not in git. A fresh checkout, including the Vercel deploy, serves `src/lib/seed.ts` until an admin saves a catalog on a machine that can write those files. `.vercelignore` keeps the whole `data/` folder off deploys.
