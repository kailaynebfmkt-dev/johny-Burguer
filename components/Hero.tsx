"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO, LINK_PEDIDO } from "@/lib/content";
import type { Ctl } from "./hero/Burger";

const BurgerCanvas = dynamic(() => import("./hero/BurgerCanvas"), { ssr: false });

const FUMACA = [
  { x: 18, w: 22, d: "0s", v: -3 },
  { x: 38, w: 26, d: "2.2s", v: 4 },
  { x: 55, w: 20, d: "4.6s", v: -5 },
  { x: 70, w: 24, d: "1.2s", v: 3 },
  { x: 30, w: 18, d: "6s", v: 5 },
];

function temWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function Titulo() {
  let i = 0;
  const palavras = HERO.titulo.split(" ");
  return (
    <h1 className="hero-titulo" aria-label={HERO.titulo} style={{ "--atraso": "3.3s" } as CSSProperties}>
      {palavras.map((p, k) => (
        <span key={k}>
          <span className="palavra" aria-hidden="true">
            {[...p].map((ch) => {
              const idx = i++;
              return (
                <span key={idx} className={`letra${ch === "." ? " ponto" : ""}`} style={{ "--i": idx } as CSSProperties}>
                  {ch}
                </span>
              );
            })}
          </span>
          {k < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </h1>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const ctl = useRef<Ctl>({ start: null, frozen: null, run: 0, reduced: false });
  const [modo, setModo] = useState<"inicio" | "3d" | "foto">("inicio");

  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ctl.current.reduced = reduzido;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModo(temWebGL() ? "3d" : "foto");
  }, []);

  const montarDeNovo = () => {
    const c = ctl.current;
    c.start = performance.now() + 100;
    c.run += 1;
    c.frozen = null;
  };

  return (
    <section id="topo" className="hero" ref={heroRef} aria-label="Johny Burger — smash burger artesanal">
      <div className="fumaca" aria-hidden="true">
        {FUMACA.map((f, k) => (
          <i key={k} style={{ "--x": f.x, "--w": f.w, "--d": f.d, "--v": f.v } as CSSProperties} />
        ))}
      </div>

      {modo === "3d" && <BurgerCanvas ctl={ctl} heroRef={heroRef} onFalha={() => setModo("foto")} />}

      {modo === "foto" && (
        <div className="hero-foto">
          <div className="hero-foto-quadro">
            <Image src="/img/bacon.webp" alt="Hambúrguer smash com bacon, cheddar derretendo e cebola caramelizada" width={693} height={858} priority unoptimized />
          </div>
        </div>
      )}

      <div className="hero-topo">
        <Titulo />
      </div>

      <div className="hero-base">
        <p className="hero-sub">{HERO.subtitulo}</p>
        <div className="hero-botoes">
          <a className="btn btn-primario btn-grande btn-pulsa" href={LINK_PEDIDO} target="_blank" rel="noopener noreferrer">
            FAZER PEDIDO
          </a>
          <a className="btn btn-contorno btn-grande" href="#cardapio">
            VER CARDÁPIO
          </a>
        </div>
      </div>

      {modo === "3d" && (
        <button type="button" className="hero-restart" onClick={montarDeNovo} aria-label="Montar o hambúrguer de novo">
          <span className="giro">↻</span> Montar de novo
        </button>
      )}
    </section>
  );
}
