# [osu!](https://osu.ppy.sh) Atlas

![osu! Atlas preview](public/og-preview.png)

When I was on my trip to China I was looking for a tool like this to help me arrange meetups, but there wasn't one. So I made one.

Sign in with your osu! account, and it throws your entire friend list onto a world map grouped by country. Hover for the count, click to see who's there.

## Tech

- **Next.js** for the web app, deployed on Vercel
- **osu! OAuth** for authentication
- **Three.js** + react-globe.gl for the 3D globe
- **Neon Postgres** for sign-in analytics
