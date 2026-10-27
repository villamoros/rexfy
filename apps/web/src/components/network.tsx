/**
 * The brand's "red" graphic: nodes joined by thin links, drawn behind Noche sections.
 * Positions come from a fixed seed so server and client render the same picture.
 */
function points(count: number, seed: number, width: number, height: number) {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, () => [
    Math.round(random() * width),
    Math.round(random() * height),
  ]);
}

export function Network({
  className = "",
  width = 1200,
  height = 600,
  count = 44,
  seed = 7,
}: {
  className?: string;
  width?: number;
  height?: number;
  count?: number;
  seed?: number;
}) {
  const nodes = points(count, seed, width, height);
  const links = nodes.flatMap(([x, y], i) =>
    nodes
      .map(([a, b], j) => ({ j, d: (a - x) ** 2 + (b - y) ** 2 }))
      .filter(({ j }) => j > i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .map(({ j }) => [x, y, nodes[j][0], nodes[j][1]]),
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <g stroke="var(--net-line)" strokeWidth="1">
        {links.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 9 === 0 ? 4 : 2.5}
          fill={i % 9 === 0 ? "var(--signal)" : "var(--net-node)"}
        />
      ))}
    </svg>
  );
}
