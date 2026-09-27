# The Six-String Museum

**Live:** https://ggps4.github.io/six-string-museum/

A guitar museum you can walk around. The grounds are a giant guitar lying in the grass at night: the lobby lawn is at the tail, the soundhole is a pond, the neck is a promenade with frets for crosswalks, and the headstock holds the Guitar Teacher conservatory. Eleven wings stand on the body and along the neck, and each one has an interior you can step into.

Every sound is synthesized live in the browser with a plucked-string (Karplus–Strong) model and the Web Audio API. There are no audio files.

## Getting around

- **Walk:** WASD or the arrow keys, drag to look, Q/E to turn, Shift to run. Phones get an on-screen stick.
- **Fly:** drag to orbit, scroll or pinch to zoom, click any building.
- **Step inside:** walk up to a glowing door and press Enter. Walk back out through the door or press Esc.
- **Play the strings:** six glowing strings run from the bridge to the headstock. Walk across them to pluck them. Where you cross along the neck sets the fret (the dot inlays mark frets 3, 5, 7, 9 and 12). You can also click a string.
- **Wings** in the top bar lists every building and takes you there.

## The wings

| | Wing | Outside | Inside |
| --- | --- | --- | --- |
| A | Hall of Fame | Columned museum on the lower bout | Donated guitars hang on the walls, and sold, broken and lost ones rest behind the Graveyard fence. Click a guitar for its story. |
| B | Luthier Workshop | Timber barn with a sawtooth roof | Your current build lies on the bench and updates as you change it. |
| C | Riff Roulette | Neon jukebox arcade | A slot machine with four reels and a lever to pull, plus the riff wall. |
| D | Pedalboard | A building shaped like a giant stompbox | Your pedal chain as giant pedals. Stomp one to bypass it, or click the amp to play. |
| E | Tone Detective | Brick office with a water tower and a neon question mark | Case files on the desk and a record player for the mystery tones. |
| F | Guitar Teacher | Domed conservatory on the headstock | A chalkboard showing your current lesson and all 50 lessons as tiles on the walls. |
| G | Chord Tarot | Striped fortune-teller's tent | A crystal ball draws three chord cards onto the table. |
| H | Wood Library | Log cabin | Eleven drawers of tonewood, each one clickable. |
| I | Fretboard Speedrun | Arcade with a chasing-light marquee | A cabinet and a fretboard set into the floor. |
| J | Family Tree | Glass greenhouse | A tree whose glowing fruit are instruments from the oud to the seven-string. |
| K | Neck Hospital | Clinic with a lit guitar-pick cross | Patients on the beds and a heart monitor. |

Each wing's full controls (forms, quizzes, games, the 50 lessons) open in a side panel.

## Saved data

Donated guitars, riffs, pedal rigs, speedrun times and lesson progress are saved in your browser (localStorage).

## Running locally

Requires Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run typecheck
```

Every push to `main` builds the site in GitHub Actions and deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`).

## Code layout

Vite + TypeScript + Three.js, plus plain DOM for the panels.

```
src/
  main.ts            start-up: landing card, HUD, world
  wings.ts           the eleven wings and where they stand
  world/
    World.ts         renderer, fly/walk modes, picking, rooms, string plucking, minimap
    geo.ts           the guitar-shaped campus: bouts, neck, frets, strings, headstock
    campus.ts        builds the grounds, strings, gate, lamps and pavilions
    pavilions.ts     one exterior architecture per wing
    interiors.ts     one interior per wing
    guitar3d.ts      3D guitars from Workshop builds
    walk.ts          first-person walking (adapted from Musical City)
    textures.ts      procedural canvas textures
    labels.ts        floating signboards
  ui/hud.ts          top bar, directory, wing panel, prompts, touch stick
  legacy/            the wing logic, sound engine and 50 lessons (plain JS)
```

Pedal names and guitar builds are invented. The Family Tree names real historical instruments with approximate dates.
