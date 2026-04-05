# 🧟 DEAD ZONE — Tower Defense

Survive 20 waves of increasingly brutal undead. Build towers, earn scrap, defend the supply line.

## Features
- 7 tower types (Marksman, Boomstick, Inferno, Spike Trap, Arc Pylon, Cannon, Cryo Tower)
- 10 zombie types including Chargers, Armored, Healers, and two boss tiers
- Full sound design with Tone.js
- Particle effects, blood splatter, screen shake
- Progressive difficulty with zombie abilities (armor, regen, charging, healing)

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
```

The output goes to the `dist/` folder.

## Deploy

### Vercel (recommended)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Import your GitHub repo
4. Framework preset: **Vite** (auto-detected)
5. Click **Deploy** — done!

### Netlify
1. Push to GitHub
2. Go to [netlify.com](https://app.netlify.com) → "Add new site" → "Import from Git"
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy** — done!

### GitHub Pages
1. Install the plugin: `npm install -D vite-plugin-gh-pages`
2. Add to `package.json` scripts: `"deploy": "vite build && npx gh-pages -d dist"`
3. Run `npm run deploy`

## License
Free to use, modify, and distribute.
