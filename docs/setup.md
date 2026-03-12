# Setup

## Prerequisites
- Node.js 18+
- An osu! OAuth application (create at https://osu.ppy.sh/home/account/edit → OAuth)

## Environment Variables

Create a `.env` file in the project root:

```
OSU_CLIENT_ID=<your osu! OAuth client ID>
OSU_CLIENT_SECRET=<your osu! OAuth client secret>
OSU_REDIRECT_URI=http://localhost:3000/api/auth/osu/callback
```

For production (Vercel), set these in the Vercel dashboard under Settings → Environment Variables, with `OSU_REDIRECT_URI` pointing to your production domain:

```
OSU_REDIRECT_URI=https://osu-atlas.com/api/auth/osu/callback
```

Make sure the callback URL in your osu! OAuth app settings matches exactly.

## Required OAuth Scopes
The app requests these scopes from osu!:
- `public` — read public data
- `identify` — read the user's own profile
- `friends.read` — read the user's friends list

## Running Locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Set the three environment variables above
4. Deploy — Next.js is auto-detected
