"use client";

import { useEffect, useRef } from "react";

/**
 * Tela de carregamento curtíssima (máx. ~1 s) com o logo pulsando.
 * Ao sair, marca <html data-aberto> e dispara "johny:abertura" para o hero iniciar a montagem.
 */
export default function Loader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abrir = () => {
      if (document.documentElement.dataset.aberto) return;
      document.documentElement.dataset.aberto = "1";
      ref.current?.classList.add("sai");
      window.dispatchEvent(new Event("johny:abertura"));
    };
    const t = window.setTimeout(abrir, 750);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="loader" ref={ref} role="status" aria-label="Carregando">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Johny Burger" width={600} height={213} fetchPriority="high" />
    </div>
  );
}
