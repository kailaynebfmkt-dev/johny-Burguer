import Image from "next/image";
import {
  CARDAPIO,
  COMBO,
  CONTATO,
  GALERIA,
  LINK_CONTATO,
  LINK_INSTAGRAM,
  LINK_PEDIDO,
  NAV,
  RODAPE,
  SOBRE,
} from "@/lib/content";
import { ICONES, IconeInstagram, IconePino, IconeRelogio } from "./Icons";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/* ------------------------------------------------ CARDÁPIO */
export function Cardapio() {
  return (
    <section id="cardapio" className="secao cardapio">
      <div className="container">
        <span className="secao-kicker">Cardápio</span>
        <h2 className="secao-titulo">
          OS MAIS <em>PEDIDOS</em>
        </h2>

        <div className="cards">
          {CARDAPIO.itens.map((it, i) => (
            <article className="card" key={it.nome}>
              <div className="card-midia">
                <span className="card-num">Nº 0{i + 1}</span>
                <Image src={it.foto} alt={it.alt} width={it.largura} height={it.altura} unoptimized />
              </div>
              <div className="card-corpo">
                <h3>{it.nome}</h3>
                <p>{it.descricao}</p>
                <ul className="tags" aria-label="Ingredientes">
                  {it.ingredientes.map((ing) => (
                    <li key={ing}>{ing}</li>
                  ))}
                </ul>
                <a className="btn btn-primario" href={LINK_PEDIDO} {...ext}>
                  PEDIR AGORA
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="nota-preco">Valores sempre atualizados no cardápio online.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------ COMBO */
function Selo() {
  const txt = "COMBO • COMBO • COMBO • COMBO • ";
  return (
    <div className="selo" aria-hidden="true">
      <svg className="selo-disco" viewBox="0 0 120 120">
        <defs>
          <path id="selo-circulo" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#f5a623" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="#0b0b0b" strokeWidth="1.5" strokeDasharray="3 3" />
        <text fontFamily="var(--fonte-titulo), Impact, sans-serif" fontSize="15" letterSpacing="2.4" fill="#0b0b0b">
          <textPath href="#selo-circulo" startOffset="0">
            {txt}
          </textPath>
        </text>
        <circle cx="60" cy="60" r="27" fill="#b3261e" />
      </svg>
      <div className="selo-centro" style={{ color: "#fff" }}>
        2x
      </div>
    </div>
  );
}

export function Combo() {
  return (
    <section id="combo" className="combo">
      <div className="combo-fundo" style={{ backgroundImage: `url(${COMBO.foto})` }} aria-hidden="true" />
      <span className="combo-barra-linha topo" aria-hidden="true" />
      <span className="combo-barra-linha base" aria-hidden="true" />
      <div className="container combo-grid">
        <div className="combo-foto">
          <Selo />
          <div className="combo-foto-img">
            <Image src={COMBO.foto} alt={COMBO.alt} width={COMBO.largura} height={COMBO.altura} unoptimized />
          </div>
        </div>

        <div className="combo-texto">
          <span className="secao-kicker" style={{ textAlign: "left" }}>
            Combo em destaque
          </span>
          <h2>
            COMBO <em>X-SALADÃO</em>
          </h2>
          <ul className="combo-lista">
            {COMBO.itens.map((it) => {
              const Ico = ICONES[it.icone as keyof typeof ICONES];
              return (
                <li key={it.texto}>
                  <Ico className="combo-icone" />
                  <span>{it.texto}</span>
                </li>
              );
            })}
          </ul>
          <p className="combo-frase">{COMBO.frase}</p>
          <a className="btn btn-primario btn-grande" href={LINK_PEDIDO} {...ext}>
            {COMBO.botao}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ SOBRE + MARQUEE */
export function Sobre() {
  // duas cópias do mesmo conjunto: o trilho anda -50% e recomeça sem pular
  const palavras = [...SOBRE.marquee, ...SOBRE.marquee, ...SOBRE.marquee];
  return (
    <section id="sobre" className="secao sobre">
      <div className="container">
        <span className="secao-kicker">Sobre</span>
        <h2 className="secao-titulo">
          POR QUE O <em>JOHNY?</em>
        </h2>
        <div className="blocos">
          {SOBRE.blocos.map((b) => {
            const Ico = ICONES[b.icone as keyof typeof ICONES];
            return (
              <div className="bloco" key={b.titulo}>
                <Ico className="bloco-icone" />
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-trilho">
          {[0, 1].map((k) => (
            <span key={k}>
              {palavras.map((p, i) => (
                <span key={`${p}-${i}`} style={{ display: "contents" }}>
                  {p}
                  <b />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ GALERIA */
export function Galeria() {
  return (
    <section id="galeria" className="secao galeria">
      <div className="container">
        <span className="secao-kicker">Instagram</span>
        <h2 className="secao-titulo">
          SEGUE O <em>JOHNY</em>
        </h2>
        <div className="grade">
          {GALERIA.fotos.map((f) => (
            <a key={f.src} href={LINK_INSTAGRAM} {...ext} aria-label={`${f.alt} — abrir Instagram`}>
              <Image src={f.src} alt={f.alt} width={f.w} height={f.h} unoptimized />
            </a>
          ))}
        </div>
        <div className="centro">
          <a className="btn btn-contorno btn-grande" href={LINK_INSTAGRAM} {...ext}>
            <IconeInstagram className="ig-icone" />
            {GALERIA.botao}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ CONTATO */
export function Contato() {
  return (
    <section id="contato" className="secao contato">
      <div className="container">
        <span className="secao-kicker">Contato</span>
        <h2 className="secao-titulo">
          BATEU A <em>FOME?</em>
        </h2>
        <div className="contato-botoes">
          <a className="btn btn-primario btn-grande btn-pulsa" href={LINK_PEDIDO} {...ext}>
            {CONTATO.pedir}
          </a>
          <a className="btn btn-contorno btn-grande" href={LINK_CONTATO} {...ext}>
            {CONTATO.falar}
          </a>
        </div>
        <div className="contato-info">
          <div className="info">
            <IconePino />
            <div>
              <h3>Endereço</h3>
              <p>{CONTATO.endereco}</p>
            </div>
          </div>
          <div className="info">
            <IconeRelogio />
            <div>
              <h3>Horário de funcionamento</h3>
              <p>{CONTATO.horario}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ RODAPÉ */
export function Rodape() {
  return (
    <footer className="rodape">
      <div className="container rodape-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rodape-logo" src="/logo.png" alt="Johny Burger" width={600} height={213} loading="lazy" />
        <a className="rodape-ig" href={LINK_INSTAGRAM} {...ext} aria-label="Instagram da Johny Burger">
          <IconeInstagram />
        </a>
        <ul className="rodape-links">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href}>{n.label}</a>
            </li>
          ))}
          <li>
            <a href={LINK_PEDIDO} {...ext}>
              Fazer pedido
            </a>
          </li>
          <li>
            <a href={LINK_CONTATO} {...ext}>
              Fale com a gente
            </a>
          </li>
        </ul>
        <small>{RODAPE.direitos}</small>
      </div>
    </footer>
  );
}
