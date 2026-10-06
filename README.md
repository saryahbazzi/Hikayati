# Hikayati · حكايتي — homepage

Bilingual (EN LTR / AR RTL) marketing homepage. Next.js App Router, React, TypeScript, Tailwind v4. Static mock data only.

```bash
npm install
npm run dev      # http://localhost:3000 → /en  (Arabic at /ar)
npm run build
```

- `lib/content.ts` — all copy in both languages + the sample wedding used by the mockups
- `components/brand-mark.tsx` — hero lockup; Arabic is written on via SVG `<mask>` pen strokes (CSS only)
- `lib/calligraphy.ts` — **generated** glyph outlines + pen paths; edit `scripts/pen.json` and run
  `npm run calligraphy -- /path/to/Amiri-Regular.ttf` (needs the TTF from Google Fonts) to regenerate
- `components/invitation-card.tsx`, `guest-card.tsx`, `qr-mock.tsx` — the signature visuals
- Animations respect `prefers-reduced-motion` (the word simply appears fully written).
