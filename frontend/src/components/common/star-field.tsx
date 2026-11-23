/**
 * Faint champagne stars behind the page. A fixed-seed random generator keeps the
 * server and browser output identical, so hydration never mismatches.
 */

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(1909);
const STARS = Array.from({ length: 40 }, () => {
  const r = rand();
  return {
    left: rand() * 100,
    top: rand() * 100,
    size: r < 0.1 ? 2 : 1,
    duration: 4 + rand() * 5,
    delay: -rand() * 8,
  };
});

export function StarField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle bg-champagne absolute rounded-full"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              "--twinkle-duration": `${s.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
