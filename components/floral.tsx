/**
 * Tonal botanical sprig used on the invitation card. Drawn in a single champagne tone at low
 * opacity and given a light/dark offset shadow (`.emboss`) so it reads as blind-embossed paper.
 */
export function Sprig({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  const leaves: [number, number, number][] = [
    [52, 238, -50], [78, 205, 40], [58, 170, -55], [84, 135, 35], [74, 100, -60], [106, 72, 30],
  ];
  return (
    <svg
      viewBox="0 0 160 300"
      className={`emboss ${className}`}
      style={flip ? { transform: "scale(-1,-1)" } : undefined}
      aria-hidden
      fill="none"
    >
      <g stroke="#c9b68b" strokeWidth="1.2" strokeLinecap="round" opacity=".75">
        <path d="M18 296 C 54 220, 34 130, 112 34" />
        {leaves.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M0 0 C 10 -14, 30 -14, 40 0 C 30 12, 10 12, 0 0Z" fill="#e6dcc3" fillOpacity=".7" />
            <path d="M2 0 L 36 0" strokeWidth=".7" />
          </g>
        ))}
        {/* blossom */}
        <g transform="translate(116 28)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-13" rx="7" ry="13" transform={`rotate(${a})`} fill="#ece3cd" fillOpacity=".85" />
          ))}
          <circle r="4" fill="#d9c9a0" />
        </g>
        <g transform="translate(138 74) scale(.6)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-13" rx="7" ry="13" transform={`rotate(${a})`} fill="#ece3cd" fillOpacity=".85" />
          ))}
          <circle r="4" fill="#d9c9a0" />
        </g>
      </g>
    </svg>
  );
}

/** Small lozenge divider used between name blocks. */
export function Lozenge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden fill="none" stroke="#b9a273" strokeWidth=".8">
      <path d="M0 6 H48 M72 6 H120" />
      <path d="M60 1 L65 6 L60 11 L55 6Z" fill="#c9b68b" fillOpacity=".5" />
    </svg>
  );
}
