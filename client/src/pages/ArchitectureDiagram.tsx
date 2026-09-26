import "./architecture-diagram.css";

/**
 * Live animated architecture diagram for CDCS.
 * Drop <ArchitectureDiagram /> inside the #architecture-diagram container in Home.tsx.
 *
 * The "live" effect is done entirely with native SVG <animate>/<animateMotion> loops
 * (a traveling dot per edge), so it runs continuously without any React state/interval —
 * no re-renders, no jitter, no hover interaction.
 */

type NodeDef = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  group: "client" | "control" | "backend" | "storage" | "consensus";
};

type EdgeDef = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  bidirectional?: boolean;
};

const nodes: NodeDef[] = [
  { id: "dashboard", x: 40, y: 40, w: 200, h: 60, title: "Dashboard", subtitle: "Browser dashboard UI", group: "client" },

  { id: "main", x: 40, y: 150, w: 200, h: 60, title: "Main", subtitle: "Boots backend + nodes", group: "control" },

  { id: "backend", x: 470, y: 150, w: 200, h: 60, title: "Backend", subtitle: "HTTP handling", group: "backend" },
  { id: "cdcs", x: 740, y: 150, w: 200, h: 60, title: "CDCS Client", subtitle: "gRPC client", group: "backend" },
  { id: "proto", x: 740, y: 40, w: 200, h: 60, title: "Proto", subtitle: "gRPC service contract", group: "backend" },

  { id: "raft", x: 780, y: 340, w: 210, h: 60, title: "Raft", subtitle: "Raft consensus", group: "consensus" },
  { id: "reedsolomon", x: 490, y: 340, w: 230, h: 60, title: "Reed-Solomon", subtitle: "Encode / reconstruct 4+2", group: "consensus" },
  { id: "cs", x: 490, y: 450, w: 230, h: 68, title: "Singleflight", subtitle: "First 4 of 6 shards win", group: "consensus" },

  { id: "nodesgo", x: 40, y: 340, w: 200, h: 60, title: "Nodes", subtitle: "Storage nodes (×8)", group: "storage" },
  { id: "server", x: 40, y: 450, w: 200, h: 60, title: "Server", subtitle: "Get / Put / Delete", group: "storage" },
  { id: "engine", x: 40, y: 560, w: 200, h: 60, title: "PebbleDB", subtitle: "2Q cache + disk storage", group: "storage" },
];

const edges: EdgeDef[] = [
  { from: "dashboard", to: "main" },
  { from: "main", to: "backend" },
  { from: "main", to: "nodesgo" },
  { from: "backend", to: "cdcs" },
  { from: "cdcs", to: "proto" },
  { from: "cdcs", to: "reedsolomon" },
  { from: "reedsolomon", to: "raft" },
  { from: "reedsolomon", to: "cs" },
  { from: "cs", to: "server", label: "gRPC · Get/Put/Delete", bidirectional: true },
  { from: "nodesgo", to: "server" },
  { from: "server", to: "engine" },
];

const groupColor: Record<NodeDef["group"], string> = {
  client: "var(--signal-blue)",
  control: "#7c5cff",
  backend: "#1fae6a",
  consensus: "var(--coral)",
  storage: "#e08a1e",
};

function center(n: NodeDef) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function edgePath(a: NodeDef, b: NodeDef) {
  const c1 = center(a);
  const c2 = center(b);
  const midX = (c1.x + c2.x) / 2;
  return `M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`;
}

// Wraps text onto a second line by word boundary, sized to the node's actual box width
// (monospace char-width estimate) instead of a flat guess — so it never overflows the box.
function wrapLines(text: string, boxWidth: number, charWidth: number): string[] {
  const maxChars = Math.max(6, Math.floor((boxWidth - 36) / charWidth));
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

export default function ArchitectureDiagram() {
  return (
    <div className="arch-diagram-wrap">
      <svg
        viewBox="0 0 1050 640"
        className="arch-diagram-svg"
        role="img"
        aria-label="CDCS system architecture diagram"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-copy)" />
          </marker>
          <filter id="soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="var(--ink)" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* group backdrops */}
        <rect x="20" y="320" width="260" height="300" rx="16" className="arch-zone" />
        <text x="34" y="312" className="arch-zone-label">STORAGE NODE PLANE</text>

        <rect x="470" y="320" width="560" height="220" rx="16" className="arch-zone" />
        <text x="484" y="312" className="arch-zone-label">BACKEND, CONSENSUS &amp; ENCODING</text>

        {/* edges */}
        <g>
          {edges.map((e, idx) => {
            const a = byId[e.from];
            const b = byId[e.to];
            if (!a || !b) return null;
            const d = edgePath(a, b);
            const dur = 2.6 + (idx % 4) * 0.4;
            const delay = (idx % 5) * 0.5;
            return (
              <g key={idx}>
                <path
                  d={d}
                  className={`arch-edge ${e.dashed ? "arch-edge-dashed" : ""}`}
                  markerEnd="url(#arrow)"
                  markerStart={e.bidirectional ? "url(#arrow)" : undefined}
                />
                {!e.dashed && (
                  <circle r="3.5" className="arch-pulse-dot">
                    <animateMotion
                      dur={`${dur}s`}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                      path={d}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      keyTimes="0;0.08;0.92;1"
                      dur={`${dur}s`}
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {e.label && (
                  <text
                    x={(center(a).x + center(b).x) / 2}
                    y={(center(a).y + center(b).y) / 2 - (e.label.length > 15 ? 20 : 12)}
                    className="arch-edge-label"
                    textAnchor="middle"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* nodes */}
        <g>
          {nodes.map((n) => {
            const titleLines = wrapLines(n.title, n.w, 7.6);
            const subtitleLines = wrapLines(n.subtitle, n.w, 6.2);
            const titleY = 23;
            const subtitleStartY = titleY + titleLines.length * 15 + 3;
            const contentBottom = subtitleStartY + (subtitleLines.length - 1) * 13 + 14;
            const h = Math.max(n.h, contentBottom + 14);
            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`} filter="url(#soft-shadow)">
                <rect
                  width={n.w}
                  height={h}
                  rx="12"
                  className="arch-node-rect"
                  style={{ stroke: groupColor[n.group] }}
                />
                <rect width="6" height={h} rx="3" style={{ fill: groupColor[n.group] }} />
                <text x="18" y={titleY} className="arch-node-title">
                  {titleLines.map((line, i) => (
                    <tspan key={i} x="18" dy={i === 0 ? 0 : 15}>
                      {line}
                    </tspan>
                  ))}
                </text>
                <text x="18" y={subtitleStartY} className="arch-node-subtitle">
                  {subtitleLines.map((line, i) => (
                    <tspan key={i} x="18" dy={i === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="arch-legend">
        {(Object.keys(groupColor) as NodeDef["group"][]).map((g) => (
          <span key={g} className="arch-legend-item">
            <span className="arch-legend-dot" style={{ background: groupColor[g] }} />
            {g === "client" && "Client"}
            {g === "control" && "Control plane"}
            {g === "backend" && "Backend / RPC"}
            {g === "consensus" && "Consensus & encoding"}
            {g === "storage" && "Storage nodes"}
          </span>
        ))}
      </div>
    </div>
  );
}