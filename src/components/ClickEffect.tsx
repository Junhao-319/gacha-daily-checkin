import { useEffect, useRef, useState } from "react";

interface ClickBurst {
  id: number;
  x: number;
  y: number;
  color: string;
}

const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];

export function ClickEffect() {
  const [bursts, setBursts] = useState<ClickBurst[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const burst: ClickBurst = {
        id: nextId.current++,
        x: event.clientX,
        y: event.clientY,
        color: COLORS[(nextId.current - 1) % COLORS.length]
      };
      setBursts((current) => [...current.slice(-5), burst]);
      const timer = window.setTimeout(() => {
        setBursts((current) => current.filter((item) => item.id !== burst.id));
      }, 760);
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
              "--click-color": burst.color
            } as React.CSSProperties
          }
        >
          <i />
          <i />
          <i />
          <i />
        </span>
      ))}
    </div>
  );
}