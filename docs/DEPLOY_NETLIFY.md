# Publish PULSE with GitHub, Netlify and MongoDB Atlas

This guide assumes the folder containing `package.json` is the GitHub repository root. Netlify currently supports Next.js App Router and route handlers through its managed OpenNext adapter; do not add a static export or pin a separate Next adapter. Check the linked provider documentation again before deploying because plans and free-tier limits can change.

## 1. Prepare the owner credentials

From the PULSE project folder in VS Code's terminal:

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Copy the generated value into `AUTH_SECRET` in `.env.local`. Keep it private; changing it signs out existing sessions.

Generate a salted scrypt password hash. The script hides password input and prints only the hash:

```powershell
node scripts/hash-password.mjs
```

Use a unique password with at least 14 characters. Set `PULSE_OWNER_USERNAME=madhvendrasingh007` and `PULSE_OWNER_PASSWORD_HASH` in `.env.local`. There is no public signup. If you lose the password, generate a new hash and replace the environment variable.

## 2. Create MongoDB Atlas access

1. Create a MongoDB Atlas project and a small cluster suitable for personal use.
2. Create a **database user** (this is separate from your Atlas website login). Give it read/write access only to a dedicated `pulse` database; use a unique strong password.
3. In **Network Access**, add your current public IP for local development.
4. Select **Connect → Drivers** and copy the SRV connection string. Replace the placeholders, URL-encode special characters in the database password, and add `/pulse` as the database path.
5. Put the full URI in `.env.local` as `MONGODB_URI`. Never place it in client code or commit it.

The app stores one private owner-scoped PULSE state document in Atlas and uses a separate collection for login-throttling records. Existing browser data migrates to Atlas the first time an owner signs in when the account has no saved state. Later edits sync after a short delay. If two devices edit simultaneously, PULSE detects the stale revision and asks you to reload before continuing, rather than silently overwriting a newer save. Keep Atlas backups and an export/deletion process in mind before relying on it for important records.

## 3. Run locally before publishing

```powershell
pnpm install
pnpm dev
```

For npm, `npm install` and `npm run dev` also work. Open `http://localhost:3000`, sign in using the configured owner username/password, and visit Settings to sign out. The personal profile is entered after sign-in and is stored in Atlas, not in the public source code. Before deploy, run:

```powershell
pnpm exec tsc --noEmit
pnpm build
```

## 4. Push the project to GitHub

The GitHub repository already created for this project is public. The source does not include personal health measurements or secrets; the profile is entered in the signed-in app. For additional privacy, you can change the repository to private in GitHub settings. In the VS Code terminal from the project root:

```powershell
git init
git add .
git commit -m "Build PULSE personal life OS"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. `.env.local`, `.env*` secrets, `node_modules` and `.next` are ignored. Check the staged file list before the first commit; never commit credentials, database strings or real personal logs.

## 5. Connect GitHub to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and authorize the private GitHub repository.
2. Set the repository base directory to the folder containing `package.json` (leave it blank if it is the repository root).
3. Use build command `pnpm build` (or `npm run build`). Leave the publish directory and Next.js adapter to Netlify's automatic framework detection.
4. Set the Node version to 22 in Netlify's build environment (for example, `NODE_VERSION=22`).
5. Add environment variables in the Netlify UI, with runtime **Functions** scope for server values. Do not put secrets in `netlify.toml`, GitHub source, or `NEXT_PUBLIC_*` variables.
6. For the Production context, set:

   | Variable | Value |
   | --- | --- |
   | `AUTH_SECRET` | A new random 32-byte base64 value generated for production. Do not reuse your local secret. |
   | `AUTH_URL` | `https://your-site-name.netlify.app` (replace with the actual production URL). |
   | `PULSE_OWNER_USERNAME` | `madhvendrasingh007` (or your chosen owner username). |
   | `PULSE_OWNER_PASSWORD_HASH` | The output from `node scripts/hash-password.mjs`; never the plain password. |
   | `MONGODB_URI` | Atlas connection string for a production database user/database. |
   | `GEMINI_API_KEY` | Optional. Leave unset to use the local-only Coach fallback. |
   | `GEMINI_MODEL` | Optional; defaults to `gemini-3.8-flash`. |

7. Save and deploy. Open the production URL, confirm it redirects to the owner login, sign in, check the Coach, and verify sign out returns to `/login`.

Set production secrets only in the Production context. Deploy previews should have separate test credentials and a separate test database—or no secrets, in which case protected application access fails closed. Never point public preview builds at your personal production database.

## 6. Atlas networking and Netlify egress

Atlas accepts database connections only from IP addresses in its project IP access list. Netlify Function egress addresses can vary on standard plans; Netlify documents static private connectivity as an Enterprise add-on. For a company-grade network boundary, use a hosting/network plan with static egress or private connectivity and allowlist those addresses in Atlas. Avoid `0.0.0.0/0` for production because it permits connection attempts from any IP; if you temporarily use it for a personal prototype, compensate with a dedicated least-privilege DB user, a strong unique password, TLS, and no production personal data, then replace it with restricted networking.

Free plans and quotas are subject to change. Verify current availability and limits on both provider dashboards.

## 7. Optional conversational AI

The local energy calculator and a couple of explicit offline commands work without an AI account. To enable conversational workout/nutrition guidance, create a Gemini API key in Google AI Studio, set `GEMINI_API_KEY` in Netlify's production environment, and redeploy. The key is used only by the authenticated server route. Review Google's current terms, rate limits and billing for your account before enabling it. Do not expose the key in browser code.

## What is still needed for a true production personal-data app

The sign-in boundary, no-signup policy, request validation, session expiry and login throttling are wired. The current tracker still uses browser storage. Before relying on cross-device or durable records, implement authenticated MongoDB repositories and CRUD route handlers for each personal log, add per-user ownership checks and database indexes, add backups/export and deletion flows, and migrate local data. Do not describe the current version as cloud-synced or backed up.

## Official references

- [Netlify: Next.js overview and App Router support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify: private connectivity and static function egress](https://docs.netlify.com/manage/security/private-connectivity/)
- [Netlify: function environment variables](https://docs.netlify.com/build/functions/environment-variables/)
- [MongoDB Atlas: connect to a cluster](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [Auth.js: Credentials provider guidance](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js: protect resources](https://authjs.dev/getting-started/session-management/protecting)
