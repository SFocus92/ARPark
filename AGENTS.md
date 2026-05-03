# AGENTS.md

## Commands

```bash
npm run dev      # Dev server on port 3000
npm run build    # Production build
npm run start    # Run production server (requires build first)
npm run lint     # Lint code
```

## Key Files

- `src/lib/quest-config.ts` - **Edit this** to change park name, promo code, quest steps, UI messages
- `src/hooks/use-quest.ts` - Zustand store with localStorage persistence (key: `ar-quest-sevapark`)
- `src/app/page.tsx` - Main orchestrator, loads A-Frame/MindAR dynamically
- `src/components/ar/ar-scene.tsx` - AR camera + MindAR marker detection

## Architecture

- Next.js 16 (App Router)
- MindAR.js for AR (uses `.mind` files in `public/assets/nft/`)
- Sequential quest: markers must be found in order (1→2→3→4→5→6→7)
- State: Zustand + localStorage, AR state: `currentMarker`, `showingContent`, `cameraReady`, `cameraError`

## Constraints

- **HTTPS required** for camera access in production (localhost exempt)
- `ignoreBuildErrors: true` in next.config.ts (TypeScript errors ignored during build)
- React strict mode disabled
- All user-facing text is Russian

## Testing

- Local: `npm run dev` → http://localhost:3000
- Mobile testing: deploy to Vercel/Netlify (provides HTTPS) or use ngrok
- Dev mode: tap screen to simulate marker detection (7 tap zones = 7 markers)
- iOS: use Safari (not Chrome) for camera access

## Customization

1. Change promo code/discount: edit `PARK_CONFIG` in `src/lib/quest-config.ts`
2. Modify quest stages: edit `STEPS` array in same file
3. Add new markers: generate `.mind` file at https://hiukim.github.io/mind-ar-js-doc/tools/compile → place in `public/assets/nft/`