"use client";

import { useEffect, useState } from "react";
import { LINK_PEDIDO, NAV } from "@/lib/content";

export default function Header() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <header className="header">
        <div className="container header-in">
          <a href="#topo" className="header-logo" aria-label="Johny Burger — início" onClick={() => setAberto(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Johny Burger" width={600} height={213} />
          </a>

          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="header-acoes">
            <a className="btn btn-primario btn-pequeno" href={LINK_PEDIDO} target="_blank" rel="noopener noreferrer">
              Fazer pedido
            </a>
            <button
              type="button"
              className="menu-btn"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={aberto}
              aria-controls="menu-painel"
              onClick={() => setAberto((v) => !v)}
            >
              <span />
            </button>
          </div>
        </div>
      </header>

      <div id="menu-painel" className={`menu-painel${aberto ? " aberto" : ""}`} aria-hidden={!aberto}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="menu-link" onClick={() => setAberto(false)} tabIndex={aberto ? 0 : -1}>
            {n.label}
          </a>
        ))}
        <a
          className="btn btn-primario btn-grande"
          href={LINK_PEDIDO}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={aberto ? 0 : -1}
        >
          Fazer pedido
        </a>
      </div>
    </>
  );
}
