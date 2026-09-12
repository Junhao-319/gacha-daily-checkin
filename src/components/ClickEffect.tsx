import { useEffect, useRef, useState } from "react";

interface ClickBurst {
  id: number;
  x: number;
  y: number;
  color: string;
  colorAlt: string;
}

const COLOR_PAIRS = [
  ["#22d3ee", "#a78bfa"],
  ["#f472b6", "#fbbf24"],
  ["#34d399", "#22d3ee"],
  ["#a78bfa", "#f472b6"],
  ["#fbbf24", "#fb7185"]
];

export function ClickEffect() {
  const [bursts, setBursts] = useState<ClickBurst[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const pair = COLOR_PAIRS[(nextId.current - 1) % COLOR_PAIRS.length];
      const burst: ClickBurst = {
        id: nextId.current++,
        x: event.clientX,
        y: event.clientY,
        color: pair[0],
        colorAlt: pair[1]
      };
      setBursts((current) => [...current.slice(-6), burst]);
      const timer = window.setTimeout(() => {
        setBursts((current) => current.filter((item) => item.id !== burst.id));
      }, 900);
      timers.current.push(timer);
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      for (const timer of timers.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return (
    <div className="click-effect-layer" aria-hidden="true">
      {bursts.map((burst) => (
        <span
          className="click-burst"
          key={burst.id}
          style={
            {
              left: burst.x,
              top: burst.y,
              "--click-color": burst.color,
              "--click-color-alt": burst.colorAlt
            } as React.CSSProperties
          }
        >
          <b className="click-halo" />
          <b className="click-halo is-late" />
          <span className="click-core" />
          <span className="click-rays">
            {Array.from({ length: 10 }, (_, index) => <em key={index} />)}
          </span>
          {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
        </span>
      ))}
    </div>
  );
}