# Gnoland Ecosystem

Public directory of projects building on gno.land.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3310. `/admin` signs in an account that already exists in `data/auth.json`. The site does not create new admin accounts. On Vercel, admin accounts are read from `ADMIN_AUTH` until a password is saved, and catalog edits are stored in the private Blob store instead of the read-only disk.

`data/store.json` and `data/submissions.json` are local runtime files and are not in git. A fresh checkout, including the Vercel deploy, serves `src/lib/seed.ts` until an admin saves a catalog on a machine that can write those files. `.vercelignore` keeps the whole `data/` folder off deploys.
