/**
 * Decorative QR code (not scannable): three finder eyes, timing lines and a seeded random body,
 * drawn as softly rounded modules in charcoal with a champagne monogram knocked out of the centre.
 */
const N = 29;

function rng(seed: number) {
  // mulberry32 — deterministic so server and client render the same pattern
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildModules() {
  const rand = rng(1447);
  const reserved = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9) || // finders + quiet zone
    (Math.abs(x - N / 2 + 0.5) < 4.2 && Math.abs(y - N / 2 + 0.5) < 4.2); // monogram well
  const cells: [number, number][] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (reserved(x, y)) continue;
      const timing = (y === 6 || x === 6) && (x + y) % 2 === 0;
      if (timing || rand() > 0.52) cells.push([x, y]);
    }
  return cells;
}

const cells = buildModules();

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x=".5" y=".5" width="6" height="6" rx="1.7" fill="none" stroke="#24241f" strokeWidth="1" />
      <rect x="2" y="2" width="3" height="3" rx="1" fill="#24241f" />
    </g>
  );
}

export function QrMock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className={className} role="img" aria-label="QR code (sample)">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width=".84" height=".84" rx=".3" fill="#24241f" />
      ))}
      <Eye x={0} y={0} />
      <Eye x={N - 7} y={0} />
      <Eye x={0} y={N - 7} />
      <circle cx={N / 2} cy={N / 2} r="3.4" fill="#faf7f0" stroke="#c9b68b" strokeWidth=".35" />
      <text x={N / 2} y={N / 2 + 1.45} textAnchor="middle" fontSize="4.6" fill="#66664a" style={{ fontFamily: "var(--font-amiri), serif" }}>
        ح
      </text>
    </svg>
  );
}
