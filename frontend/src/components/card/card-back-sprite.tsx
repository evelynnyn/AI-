/**
 * Card back artwork as an SVG <symbol>, placed once in the layout. Every CardBack uses
 * <use href="#card-back" />, so the 78-card fan does not repeat the drawing.
 * Layout (symmetric): sun in the centre, a crescent above and below, axis and stars,
 * corner stars, double gold frame.
 */

const RAYS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  const r2 = i % 2 === 0 ? 29 : 24;
  const f = (n: number) => n.toFixed(2);
  return `M${f(70 + 19 * Math.cos(a))} ${f(120 + 19 * Math.sin(a))}L${f(70 + r2 * Math.cos(a))} ${f(120 + r2 * Math.sin(a))}`;
}).join("");

/** Four-pointed star. */
const star = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}L${cx + r * 0.22} ${cy - r * 0.22}L${cx + r} ${cy}L${cx + r * 0.22} ${cy + r * 0.22}L${cx} ${cy + r}L${cx - r * 0.22} ${cy + r * 0.22}L${cx - r} ${cy}L${cx - r * 0.22} ${cy - r * 0.22}Z`;

const STARS = [
  star(70, 34, 5),
  star(70, 206, 5),
  star(34, 120, 3.5),
  star(106, 120, 3.5),
  star(28, 30, 2.2),
  star(112, 30, 2.2),
  star(28, 210, 2.2),
  star(112, 210, 2.2),
].join("");

export function CardBackSprite() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <radialGradient id="card-back-bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--color-wine)" }} />
          <stop offset="100%" style={{ stopColor: "var(--color-abyss)" }} />
        </radialGradient>
        <symbol id="card-back" viewBox="0 0 140 240">
          <rect width="140" height="240" rx="10" fill="url(#card-back-bg)" />
          <g className="stroke-champagne fill-none">
            <rect x="6" y="6" width="128" height="228" rx="6" strokeWidth="1" />
            <rect
              x="10.5"
              y="10.5"
              width="119"
              height="219"
              rx="3.5"
              strokeWidth="0.5"
              opacity="0.6"
            />
            <path d="M70 42V76M70 164V198" strokeWidth="0.5" opacity="0.7" />
            <circle
              cx="70"
              cy="120"
              r="44"
              strokeWidth="0.5"
              strokeDasharray="1 3"
              opacity="0.7"
            />
            <circle cx="70" cy="120" r="34" strokeWidth="0.5" opacity="0.5" />
            <circle cx="70" cy="120" r="15" strokeWidth="0.9" />
            <circle cx="70" cy="120" r="10.5" strokeWidth="0.5" />
            <path d={RAYS} strokeWidth="0.7" strokeLinecap="round" />
          </g>
          <g className="fill-champagne">
            <circle cx="70" cy="120" r="4" />
            <path d="M60 64A10 10 0 0 0 80 64A12.5 12.5 0 0 1 60 64Z" />
            <path d="M60 176A10 10 0 0 1 80 176A12.5 12.5 0 0 0 60 176Z" />
            <path d={STARS} />
            <path d="M70 80l2 3-2 3-2-3zM70 154l2 3-2 3-2-3z" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
