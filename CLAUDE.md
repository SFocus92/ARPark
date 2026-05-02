# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AR-Quest "СеваПарк" is a WebAR-based interactive quest application for amusement parks. Players use their mobile device cameras to discover AR markers throughout a park, following a sequential 7-stage quest that culminates in a promotional code reward.

**Key Technologies:**
- Next.js 16 (React framework with App Router)
- TypeScript
- Zustand (state management with persistence)
- Tailwind CSS + minimal shadcn/ui components (button, card, progress)
- A-Frame (WebAR framework)
- MindAR.js (NFT image tracking for real object recognition)

**Language:** All user-facing content, comments, and documentation are in Russian.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Start production server (requires build first)
npm run start

# Lint code
npm run lint
```

## Architecture

### State Management Pattern

The app uses Zustand with localStorage persistence for quest state management. The single source of truth is `src/hooks/use-quest.ts`:

- **Quest state:** `isStarted`, `completedSteps`, `foundMarkers`, `isComplete`
- **AR state:** `currentMarker`, `showingContent`, `cameraReady`, `cameraError`
- **Settings:** `soundEnabled`
- **Persistence:** Quest progress is saved to localStorage under key `ar-quest-sevapark`

State updates flow through actions like `startQuest()`, `handleMarkerFound()`, `resetQuest()`.

### Quest Configuration System

All quest content is centralized in `src/lib/quest-config.ts`:

- **PARK_CONFIG:** Park name, promo code, discount, final message
- **STEPS array:** 7 sequential quest stages with marker definitions
- **MESSAGES:** User-facing feedback messages
- **AR_CONFIG:** AR detection and UI settings

Each quest step defines:
- Marker type (`nft` for MindAR image tracking)
- NFT descriptor path (e.g., `/assets/nft/marker-1` → loads `marker-1.mind`)
- Content (title, description, location, hint, clue for next step)
- 3D object type and appearance (scroll, key, gem, portal, compass, chest)
- Sound effects and animations

**To customize the quest:** Edit `quest-config.ts` - change park name, promo code, step descriptions, or add/remove stages.

### Component Architecture

**Page Flow:**
1. `src/app/page.tsx` - Main orchestrator, handles quest lifecycle
2. `src/components/ar/start-page.tsx` - Welcome screen before quest starts
3. `src/components/ar/ar-scene.tsx` - AR camera and MindAR marker detection
4. `src/components/ar/quest-ui.tsx` - Overlay UI (progress, messages, controls)
5. `src/components/ar/error-screen.tsx` - Error handling for camera/HTTPS issues

**AR Implementation:**
- A-Frame is loaded dynamically in `page.tsx` via CDN
- MindAR-Three is loaded in `ar-scene.tsx` via CDN script
- `ar-scene.tsx` manages camera access and marker detection using MindAR API
- MindAR uses `.mind` files (compiled image targets) for NFT tracking
- Requires HTTPS in production (camera access restriction)

**3D Object Rendering:**
- Objects are rendered as CSS-based 3D elements with animations
- Each object type has custom CSS animations: fadeIn, scaleIn, bounceIn, rotateIn, portalIn

### File Structure

```
src/
├── app/
│   ├── page.tsx              # Main quest app orchestrator
│   ├── layout.tsx            # Root layout with metadata
│   └── markers/page.tsx      # Printable markers page (if needed)
├── components/
│   ├── ar/                   # AR-specific components
│   │   ├── ar-scene.tsx      # Camera + MindAR marker detection
│   │   ├── start-page.tsx    # Welcome screen
│   │   ├── quest-ui.tsx      # Overlay UI
│   │   └── error-screen.tsx  # Error handling
│   └── ui/                   # Minimal shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── progress.tsx
├── hooks/
│   └── use-quest.ts          # Quest state management (Zustand)
└── lib/
    ├── quest-config.ts       # Quest configuration (EDIT THIS)
    └── utils.ts              # Utility functions (cn, etc.)

public/assets/
├── models/                   # 3D models (.glb) - referenced but not loaded yet
├── sounds/                   # Sound effects (.mp3) - referenced but not loaded yet
└── nft/                      # NFT marker descriptors (.mind files)
    ├── marker-1.mind
    ├── marker-2.mind
    └── ... (7 markers total)
```

## Key Implementation Details

### Sequential Quest Logic

The quest enforces strict sequential progression:
- Players must find markers in order (1→2→3→4→5→6→7)
- `isValidNextStep()` in `quest-config.ts` validates marker discovery
- Finding wrong marker shows error with hint for correct marker
- Finding already-found marker shows "already found" message

### MindAR Integration

**API Usage:**
```typescript
// Load MindAR script
const { MindARThree } = window;

// Create scanner with first marker
const mindarThree = new MindARThree.MindARThree({
  container: containerRef.current,
  imageTargetSrc: '/assets/nft/marker-1.mind',
});

// Add anchor for marker detection
const anchor = mindarThree.addAnchor(0);
anchor.onTargetFound = () => { /* handle detection */ };
anchor.onTargetLost = () => { /* handle loss */ };

// Start camera
await mindarThree.start();
```

**Marker Files:**
- Each marker needs a `.mind` file in `public/assets/nft/`
- `.mind` files are compiled from images using MindAR compiler
- Generate at: https://hiukim.github.io/mind-ar-js-doc/tools/compile

### Camera and HTTPS Requirements

- **HTTPS required** in production (except localhost) for camera access
- Camera requests rear-facing camera (`facingMode: 'environment'`)
- Error handling for: permission denied, camera not found, HTTPS required, browser not supported

### Dynamic Imports

A-Frame and MindAR only work client-side:
- `ARScene` component uses `dynamic()` with `ssr: false`
- Scripts loaded via `loadScript()` helper in `page.tsx` and `ar-scene.tsx`
- Suspense boundaries handle loading states

## Testing

**Local testing:**
- Run `npm run dev` and open `http://localhost:3000`
- For actual AR testing, you need HTTPS (see below)

**Mobile testing with HTTPS:**
- Use ngrok: `ngrok http 3000`
- Or deploy to Netlify/Vercel for instant HTTPS

**iOS Safari notes:**
- Must use Safari (not Chrome) for camera access
- Requires iOS 11+
- User must explicitly allow camera permission

## Deployment

**Netlify:**
```bash
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

Both platforms provide automatic HTTPS.

## Common Customization Tasks

**Change park name and promo code:**
Edit `PARK_CONFIG` in `src/lib/quest-config.ts`

**Modify quest stages:**
Edit `STEPS` array in `src/lib/quest-config.ts` - add/remove/modify steps

**Add new NFT markers:**
1. Take high-quality photo of object (1920×1080, good lighting, high contrast)
2. Generate `.mind` file at https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Place in `public/assets/nft/` as `marker-N.mind`
4. Update step config with `markerType: 'nft'` and `nftDescriptor: '/assets/nft/marker-N'`

**Change UI messages:**
Edit `MESSAGES` object in `src/lib/quest-config.ts`

## Important Notes

- This is a Russian-language application - maintain Russian for all user-facing text
- TypeScript build errors are ignored (`ignoreBuildErrors: true`) - fix if adding strict typing
- React strict mode is disabled - re-enable if needed for development
- 3D models (`.glb` files) are referenced but currently rendered as CSS - integrate actual models if needed
- Sound files are referenced but may need to be added to `public/assets/sounds/`
- MindAR requires `.mind` files, not `.fset`/`.iset` files (those are for AR.js NFT)
