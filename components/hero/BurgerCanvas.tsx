/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import BurgerScene, { LABELS, type Ctl, type Input, type Stage } from "./FotoBurger";

type Props = {
  ctl: MutableRefObject<Ctl>;
  heroRef: RefObject<HTMLElement | null>;
  onFalha: () => void;
};

/** Canvas WebGL + etiquetas + entrada do usuário (arrastar / inclinar com o cursor). */
export default function BurgerCanvas({ ctl, heroRef, onFalha }: Props) {
  const input = useRef<Input>({ px: 0, py: 0, dx: 0, drag: false });
  const stage = useRef<Stage>({ labels: [], lines: [], w: [] });
  const [visivel, setVisivel] = useState(true);
  const [mobile] = useState(
    () => typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches),
  );
  const criado = useRef(false);

  /* dispara a montagem quando o canvas existe E a tela de carregamento saiu */
  const iniciar = () => {
    if (!criado.current || !document.documentElement.dataset.aberto) return;
    const c = ctl.current;
    if (c.start != null) return;
    c.start = performance.now() + 150;
  };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("t"); // depuração: ?t=3.2 congela a linha do tempo
    if (q != null && !Number.isNaN(parseFloat(q))) ctl.current.frozen = parseFloat(q);
    window.addEventListener("johny:abertura", iniciar);
    iniciar();
    return () => window.removeEventListener("johny:abertura", iniciar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* entrada: arrastar para inclinar, seguir o cursor */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let lastX = 0;
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const inp = input.current;
      if (e.pointerType === "mouse") {
        inp.px = ((e.clientX - r.left) / r.width) * 2 - 1;
        inp.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      }
      if (inp.drag) {
        inp.dx += e.clientX - lastX;
        lastX = e.clientX;
      }
    };
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button")) return;
      input.current.drag = true;
      lastX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      input.current.drag = false;
      if (e.pointerType !== "mouse") {
        input.current.px = 0;
        input.current.py = 0;
      }
    };
    const leave = () => {
      input.current.px = 0;
      input.current.py = 0;
    };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerdown", down);
    hero.addEventListener("pointerleave", leave);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerdown", down);
      hero.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [heroRef]);

  /* só renderiza enquanto o hero está na tela (economia de bateria; não esconde nada) */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, [heroRef]);

  return (
    <>
      <div className="hero-canvas">
        <Canvas
          frameloop={visivel ? "always" : "never"}
          dpr={[1, mobile ? 1.5 : 2]}
          flat
          camera={{ fov: 30, near: 0.1, far: 60, position: [0, 3, 9] }}
          gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            criado.current = true;
            iniciar();
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              onFalha();
            });
          }}
          aria-hidden="true"
        >
          <BurgerScene ctl={ctl} input={input} stage={stage} mobile={mobile} />
        </Canvas>
      </div>

      {/* etiquetas animadas ligadas por linha fina laranja */}
      <div className="rotulos" aria-hidden="true">
        <svg>
          {LABELS.map((_, i) => (
            <line
              key={i}
              pathLength={1}
              ref={(el) => {
                stage.current.lines[i] = el;
              }}
            />
          ))}
        </svg>
        {LABELS.map((l, i) => (
          <div
            key={i}
            className={`rotulo${l.desktop ? " so-desktop" : ""}`}
            ref={(el) => {
              stage.current.labels[i] = el;
            }}
          >
            {l.txt}
          </div>
        ))}
      </div>
    </>
  );
}
