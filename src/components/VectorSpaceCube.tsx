import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MEMORY_KINDS,
  buildVectorCloud,
  type MemoryKind,
  type VectorPoint,
} from "../data/showcase";

type Props = {
  className?: string;
};

/**
 * Drag-to-rotate 3D embedding cube — color-coded memory points clustered by
 * kind so visitors can see “similar meaning sits nearby.”
 */
export function VectorSpaceCube({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const points = useMemo(() => buildVectorCloud(), []);

  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(0.35);
  const [hover, setHover] = useState<VectorPoint | null>(null);
  /** Empty set means "all" kinds are shown. */
  const [selected, setSelected] = useState<ReadonlySet<MemoryKind>>(
    () => new Set(),
  );
  const showAll = selected.size === 0;
  const toggleKind = (kind: MemoryKind) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next.size === MEMORY_KINDS.length ? new Set() : next;
    });
  const visibleCount = useMemo(
    () =>
      showAll
        ? points.length
        : points.filter((pt) => selected.has(pt.kind)).length,
    [points, selected, showAll],
  );
  const drag = useRef<{
    active: boolean;
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);
  const auto = useRef(true);
  const angles = useRef({ yaw: 0.55, pitch: 0.35 });
  const projected = useRef<
    { p: VectorPoint; sx: number; sy: number; depth: number; r: number }[]
  >([]);

  useEffect(() => {
    angles.current = { yaw, pitch };
  }, [yaw, pitch]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW < 2 || cssH < 2) return;
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const { yaw: y, pitch: p } = angles.current;
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cp = Math.cos(p);
    const sp = Math.sin(p);

    const project = (x: number, yy: number, z: number) => {
      // yaw around Y, then pitch around X
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = yy * cp - z1 * sp;
      const z2 = yy * sp + z1 * cp;
      const dist = 3.2;
      const scale = (Math.min(cssW, cssH) * 0.55) / (dist - z2);
      return {
        sx: cssW / 2 + x1 * scale,
        sy: cssH / 2 - y2 * scale,
        depth: z2,
      };
    };

    // Wireframe cube
    const corners: [number, number, number][] = [];
    for (const ix of [-1, 1]) {
      for (const iy of [-1, 1]) {
        for (const iz of [-1, 1]) {
          corners.push([ix, iy, iz]);
        }
      }
    }
    const edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 4],
      [1, 3],
      [1, 5],
      [2, 3],
      [2, 6],
      [3, 7],
      [4, 5],
      [4, 6],
      [5, 7],
      [6, 7],
    ];
    const pc = corners.map(([x, yy, z]) => project(x, yy, z));
    ctx.strokeStyle = "oklch(0.35 0 0)";
    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(pc[a].sx, pc[a].sy);
      ctx.lineTo(pc[b].sx, pc[b].sy);
      ctx.stroke();
    }

    // Axes from origin
    const origin = project(0, 0, 0);
    const axis = (
      to: [number, number, number],
      label: string,
      color: string,
    ) => {
      const tip = project(...to);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(tip.sx, tip.sy);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "600 11px ui-monospace, Menlo, monospace";
      ctx.fillText(label, tip.sx + 4, tip.sy - 4);
    };
    axis([1.15, 0, 0], "x", "oklch(0.55 0.08 250)");
    axis([0, 1.15, 0], "y", "oklch(0.55 0.08 165)");
    axis([0, 0, 1.15], "z", "oklch(0.58 0.1 85)");

    const colorOf = (kind: MemoryKind) =>
      MEMORY_KINDS.find((k) => k.tag === kind)?.color ?? "#aaa";

    const visible = showAll
      ? points
      : points.filter((pt) => selected.has(pt.kind));
    const drawn = visible
      .map((pt) => {
        const pr = project(pt.x, pt.y, pt.z);
        return { p: pt, ...pr, r: 1.3 + (pr.depth + 1) * 0.7 };
      })
      .sort((a, b) => a.depth - b.depth);

    projected.current = drawn;

    for (const d of drawn) {
      const active = hover?.id === d.p.id;
      ctx.beginPath();
      ctx.fillStyle = colorOf(d.p.kind);
      ctx.globalAlpha = active ? 1 : 0.45 + (d.depth + 1) * 0.2;
      ctx.arc(d.sx, d.sy, active ? d.r + 3 : d.r, 0, Math.PI * 2);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = "oklch(0.95 0 0)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [hover, points, selected, showAll]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (auto.current && !drag.current?.active) {
        angles.current.yaw += 0.004;
        setYaw(angles.current.yaw);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const hitTest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: (typeof projected.current)[number] | null = null;
    let bestDist = 14;
    for (const d of projected.current) {
      const dist = Math.hypot(d.sx - x, d.sy - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best?.p ?? null;
  };

  return (
    <div className={`vector-cube ${className}`.trim()} ref={wrapRef}>
      <div className="vector-cube-chrome">
        <span className="vector-cube-k">pgvector space</span>
        <span className="vector-cube-hint">
          {visibleCount.toLocaleString()} memories · drag to rotate · click a
          point
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="vector-cube-canvas"
        role="img"
        aria-label="Interactive 3D cube of memory embeddings clustered by kind. Drag to rotate."
        onPointerDown={(e) => {
          auto.current = false;
          drag.current = {
            active: true,
            x: e.clientX,
            y: e.clientY,
            yaw: angles.current.yaw,
            pitch: angles.current.pitch,
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const hit = hitTest(e.clientX, e.clientY);
          setHover(hit);
          if (!drag.current?.active) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          const nextYaw = drag.current.yaw + dx * 0.008;
          const nextPitch = Math.max(
            -1.1,
            Math.min(1.1, drag.current.pitch + dy * 0.008),
          );
          angles.current = { yaw: nextYaw, pitch: nextPitch };
          setYaw(nextYaw);
          setPitch(nextPitch);
        }}
        onPointerUp={(e) => {
          if (drag.current?.active) {
            const dx = Math.abs(e.clientX - drag.current.x);
            const dy = Math.abs(e.clientY - drag.current.y);
            if (dx < 4 && dy < 4) {
              const hit = hitTest(e.clientX, e.clientY);
              if (hit) {
              }
            }
          }
          drag.current = null;
        }}
        onPointerLeave={() => {
          setHover(null);
          drag.current = null;
        }}
      />
      {hover ? (
        <div className="vector-cube-tooltip" aria-hidden="true">
          <code className={`type-rail-tag kind-chip-${hover.kind}`}>
            {hover.kind}
          </code>
          <span>{hover.label}</span>
        </div>
      ) : null}
      <div className="vector-cube-legend" role="group" aria-label="Filter by kind">
        <button
          type="button"
          className={
            showAll ? "vector-cube-filter is-active" : "vector-cube-filter"
          }
          aria-pressed={showAll}
          onClick={() => setSelected(new Set())}
        >
          all
        </button>
        {MEMORY_KINDS.map((k) => (
          <button
            key={k.tag}
            type="button"
            className={
              selected.has(k.tag)
                ? `vector-cube-filter is-active kind-chip-${k.tag}`
                : `vector-cube-filter kind-chip-${k.tag}`
            }
            aria-pressed={selected.has(k.tag)}
            onClick={() => toggleKind(k.tag)}
            title={k.name}
          >
            {k.tag}
          </button>
        ))}
      </div>
    </div>
  );
}
