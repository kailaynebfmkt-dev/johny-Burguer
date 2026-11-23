"use client";

import { useEffect, useRef } from "react";

/** Cursor laranja (só desktop com mouse). Cresce sobre links/botões; dorme quando o mouse para. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.documentElement.classList.add("com-cursor");
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;

    const loop = () => {
      cx += (x - cx) * 0.28;
      cy += (y - cy) * 0.28;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.classList.add("visivel");
      const alvo = (e.target as Element | null)?.closest("a, button, [data-cursor]");
      el.classList.toggle("grande", !!alvo);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const sai = () => el.classList.remove("visivel");
    const desce = () => el.classList.add("aperta");
    const sobe = () => el.classList.remove("aperta");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", desce);
    window.addEventListener("pointerup", sobe);
    document.documentElement.addEventListener("pointerleave", sai);
    return () => {
      document.documentElement.classList.remove("com-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", desce);
      window.removeEventListener("pointerup", sobe);
      document.documentElement.removeEventListener("pointerleave", sai);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="cursor" ref={ref} aria-hidden="true" />;
}
