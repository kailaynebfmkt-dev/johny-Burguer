/* eslint-disable react-hooks/immutability */
"use client";

/* Hambúrguer feito com as camadas recortadas da foto do cliente (fotografia de verdade, não modelo 3D).
   Cada camada cai com gravidade, quique e leve inclinação, em sequência, assim que o site abre
   (linha do tempo por TEMPO, nunca por rolagem). */

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";
import layout from "@/lib/burger-layout.json";
import Particles from "./Particles";
import { spriteTexture } from "./geo";

/* ------------------------------------------------------------ tipos compartilhados */
export type Ctl = { start: number | null; frozen: number | null; run: number; reduced: boolean };
export type Input = { px: number; py: number; dx: number; drag: boolean };
export type Stage = { labels: (HTMLElement | null)[]; lines: (SVGLineElement | null)[]; w: number[] };

/* ------------------------------------------------------------ camadas (ordem de baixo para cima) */
const ORDEM = ["pao-baixo", "carne-baixo", "carne-cima", "bacon-cebola", "pao-cima"] as const;
type Nome = (typeof ORDEM)[number];

/** Quando cada camada é solta (s). Tudo termina em ~5 s. */
const T: Record<Nome, number> = { "pao-baixo": 0.0, "carne-baixo": 0.85, "carne-cima": 1.65, "bacon-cebola": 2.5, "pao-cima": 3.55 };
const G = 40; // gravidade

/* Etiquetas: aparecem quando a camada pousa, ligadas por uma linha fina laranja. */
export const LABELS = [
  { txt: "PÃO BRIOCHE", cam: "pao-baixo", fy: 0.6, side: 1, desktop: true },
  { txt: "SMASH 120G", cam: "carne-baixo", fy: 0.42, side: 1, desktop: false },
  { txt: "CHEDDAR", cam: "carne-baixo", fy: 0.3, side: -1, desktop: true },
  { txt: "DUPLO SMASH", cam: "carne-cima", fy: 0.7, side: 1, desktop: true },
  { txt: "CHEDDAR DUPLO", cam: "carne-cima", fy: 0.32, side: -1, desktop: false, dyM: 14 },
  { txt: "BACON", cam: "bacon-cebola", fy: 0.72, side: 1, desktop: false },
  { txt: "CEBOLA CARAMELIZADA", cam: "bacon-cebola", fy: 0.22, side: -1, desktop: false, dyM: -16 },
  { txt: "MAIONESE DA CASA", cam: "pao-cima", fy: 0.8, side: -1, desktop: true },
  { txt: "PÃO BRIOCHE", cam: "pao-cima", fy: 0.4, side: 1, desktop: false },
] as const;

/* ------------------------------------------------------------ física */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Queda com gravidade + quiques amortecidos. off = altura acima do ponto final. */
function drop(s: number, H: number, e = 0.3) {
  const t1 = Math.sqrt((2 * H) / G);
  if (s < t1) return { off: H - 0.5 * G * s * s, since: -1, f: s / t1 };
  let rem = s - t1;
  let v = G * t1 * e;
  for (let n = 0; n < 5; n++) {
    const per = (2 * v) / G;
    if (rem < per) return { off: v * rem - 0.5 * G * rem * rem, since: s - t1, f: 1 };
    rem -= per;
    v *= e;
  }
  return { off: 0, since: s - t1, f: 1 };
}

type Pose = { rx: number; ry: number; rz: number; ox: number; amp: number };

function colocar(o: THREE.Object3D | null, s: number, x: number, y: number, z: number, p: Pose, H: number) {
  if (!o) return;
  if (s < 0) {
    o.visible = false;
    return;
  }
  o.visible = true;
  const d = drop(s, H);
  const k = d.since < 0 ? Math.pow(1 - d.f, 1.5) : 0; // giro e deslocamento somem ao encostar
  o.position.set(x + p.ox * k, y + d.off, z);
  let sq = 0;
  let wob = 0;
  if (d.since >= 0) {
    wob = Math.exp(-d.since * 7) * Math.sin(d.since * 22);
    sq = p.amp * Math.exp(-d.since * 9) * Math.cos(d.since * 26);
  }
  o.rotation.set(p.rx * k + p.rz * 0.05 * wob, p.ry * k, p.rz * k + p.rx * 0.05 * wob);
  o.scale.set(1 + sq * 0.5, 1 - sq, 1);
}

/* ------------------------------------------------------------ cena */
type Props = {
  ctl: MutableRefObject<Ctl>;
  input: MutableRefObject<Input>;
  stage: MutableRefObject<Stage>;
  mobile: boolean;
};

const LW = layout.largura;
const LH = layout.altura;

export default function FotoBurger({ ctl, input, stage, mobile }: Props) {
  const texs = useTexture(ORDEM.map((n) => `/img/burger/${n}.webp`));
  const brilho = useMemo(() => spriteTexture(), []);

  const altura = mobile ? 4.5 : 3.0; // altura do hambúrguer em unidades do mundo
  const k = altura / LH;
  const largura = LW * k;

  /* geometria/posição de cada camada no mundo (centro do hambúrguer em 0,0) */
  const cams = useMemo(
    () =>
      ORDEM.map((nome, i) => {
        const c = layout.camadas.find((l) => l.nome === nome)!;
        const rnd = mulberry32(21 + i * 7);
        const pose: Pose = {
          rx: (rnd() - 0.5) * 0.7,
          ry: (rnd() - 0.5) * 1.0,
          rz: (rnd() - 0.5) * 0.3,
          ox: (rnd() - 0.5) * 1.4,
          amp: i === 0 ? 0.05 : 0.06 + rnd() * 0.04,
        };
        return {
          nome,
          w: c.w * k,
          h: c.h * k,
          x: (c.x + c.w / 2 - LW / 2) * k,
          y: (LH / 2 - (c.y + c.h / 2)) * k,
          z: i * 0.08,
          pose,
        };
      }),
    [k],
  );

  const refs = useRef<(THREE.Group | null)[]>([]);
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const actRef = useRef(0);
  const st = useRef({ rotY: 0, vel: 0, run: -1, time: 0, t: 0 });
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), v2: new THREE.Vector3() }), []);

  const mats = useMemo(
    () =>
      texs.map((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
      }),
    [texs],
  );
  const matSombra = useMemo(
    () => new THREE.MeshBasicMaterial({ map: brilho, color: "#000000", transparent: true, opacity: 0.75, depthWrite: false, depthTest: false }),
    [brilho],
  );
  const matGlow = useMemo(
    () => new THREE.MeshBasicMaterial({ map: brilho, color: "#ff7a18", transparent: true, opacity: 0.0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }),
    [brilho],
  );
  const geoPlano = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = ctl.current;
    const s = st.current;
    const { camera, size } = state;
    s.time += dt;

    if (s.run !== c.run) {
      s.run = c.run;
      s.t = 0;
      s.rotY = 0;
      s.vel = 0;
    }

    /* relógio da montagem: avança por quadro (limitado), assim um engasgo de carregamento não pula a animação */
    let t = -1;
    if (c.frozen != null) t = c.frozen;
    else if (c.start != null && performance.now() >= c.start) {
      s.t += Math.min(rawDt, 0.1);
      t = c.reduced ? 999 : s.t;
    }

    /* câmera de frente (é uma fotografia), enquadramento responsivo */
    const aspect = size.width / size.height;
    const Hv = mobile ? 5.5 / aspect : Math.max(6.3, 8.6 / aspect);
    const cam = camera as THREE.PerspectiveCamera;
    const dist = Hv / 2 / Math.tan((cam.fov * Math.PI) / 360);
    const ty = mobile ? -1.1 : 0.14;
    cam.position.set(0, ty, dist);
    cam.lookAt(0, ty, 0);
    cam.updateMatrixWorld();
    const topo = ty + Hv / 2 + 0.6; // acima do quadro: de onde as peças nascem

    /* ---- quedas ---- */
    let ultimo = 0;
    const dips: number[] = [];
    cams.forEach((cm, i) => {
      const H = Math.max(1, topo - cm.y + cm.h / 2);
      const tf = Math.sqrt((2 * H) / G);
      const ti = T[cm.nome];
      ultimo = Math.max(ultimo, ti + tf);
      dips.push(ti + tf);
      colocar(refs.current[i], t - ti, cm.x, cm.y + altura / 2, cm.z, cm.pose, H);
    });
    const pronto = ultimo + 0.55;
    const act = c.reduced ? 1 : smooth(pronto, pronto + 1.2, t);
    actRef.current = act;

    /* pilha se comprime um pouquinho a cada pouso (peso das camadas) */
    let dip = 0;
    for (const L of dips) {
      const d = t - L;
      if (d > 0) dip += 0.012 * Math.exp(-d * 9) * Math.cos(d * 28);
    }
    if (stack.current) {
      stack.current.scale.set(1 + dip * 0.4, 1 - dip, 1);
      stack.current.position.y = -altura / 2;
    }

    /* brilho laranja atrás: respira e pulsa a cada pouso */
    if (glow.current) {
      let pulso = 0;
      for (const L of dips) {
        const d = t - L;
        if (d > 0) pulso += 0.22 * Math.exp(-d * 4);
      }
      matGlow.opacity = clamp(0.1 * smooth(0, pronto, t) + pulso * 0.5 + 0.04 * Math.sin(s.time * 1.6) * act, 0, 0.7);
    }

    /* ---- inclinação: arrastar (volta sozinho), leve balanço e inclinação com o cursor ---- */
    const inp = input.current;
    if (inp.drag || Math.abs(inp.dx) > 0) {
      s.rotY = clamp(s.rotY + inp.dx * 0.007, -0.7, 0.7);
      inp.dx = 0;
    } else {
      const alvo = c.reduced || c.frozen != null ? 0 : Math.sin(s.time * 0.7) * 0.14 * act;
      s.rotY += (alvo - s.rotY) * (1 - Math.exp(-dt * 2.2));
    }
    if (spin.current) spin.current.rotation.y = s.rotY;

    const o = outer.current;
    if (o) {
      const kk = 1 - Math.exp(-dt * 5);
      o.rotation.x += (inp.py * 0.1 - o.rotation.x) * kk;
      o.rotation.z += (-inp.px * 0.04 - o.rotation.z) * kk;
      o.position.y = c.reduced ? 0 : Math.sin(s.time * 1.5) * 0.04 * act;
      o.updateMatrixWorld(true);
    }

    /* ---- etiquetas HTML ligadas às camadas por linhas finas ---- */
    const lb = stage.current;
    const stk = stack.current;
    if (stk && lb.labels.length) {
      const gone = pronto + 1.4;
      const colX = largura / 2 + (mobile ? 0.2 : 0.55);
      for (let i = 0; i < LABELS.length; i++) {
        const L = LABELS[i];
        const el = lb.labels[i], ln = lb.lines[i];
        if (!el || !ln) continue;
        if (mobile && L.desktop) continue;
        const ci = ORDEM.indexOf(L.cam);
        const cm = cams[ci];
        const on = t >= dips[ci] && t < gone;
        const off = t >= gone;
        el.classList.toggle("on", on);
        el.classList.toggle("off", off);
        ln.classList.toggle("on", on);
        ln.classList.toggle("off", off);
        if (!on) continue;
        const dy = mobile ? (("dyM" in L ? L.dyM : 0) as number) : 0;
        const ay3 = cm.y + cm.h / 2 - L.fy * cm.h;
        tmp.v.set(cm.x + L.side * cm.w * 0.36, ay3 + altura / 2, 0.2);
        stk.localToWorld(tmp.v);
        tmp.v.project(camera);
        const ax = (tmp.v.x * 0.5 + 0.5) * size.width;
        const ay = (-tmp.v.y * 0.5 + 0.5) * size.height;
        tmp.v2.set(L.side * colX, ay3 + altura / 2, 0.2);
        stk.localToWorld(tmp.v2);
        tmp.v2.project(camera);
        const wdt = lb.w[i] || (lb.w[i] = el.offsetWidth);
        let bx = (tmp.v2.x * 0.5 + 0.5) * size.width + L.side * 10;
        bx = L.side < 0 ? Math.max(bx, wdt + 6) : Math.min(bx, size.width - wdt - 6);
        const by = ay + dy;
        el.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) translate(${L.side > 0 ? "0" : "-100%"}, -50%)`;
        ln.setAttribute("x1", ax.toFixed(1));
        ln.setAttribute("y1", ay.toFixed(1));
        ln.setAttribute("x2", bx.toFixed(1));
        ln.setAttribute("y2", by.toFixed(1));
      }
    }
  });

  return (
    <>
      <group ref={outer}>
        <group ref={spin}>
          {/* brilho quente atrás e sombra de contato embaixo */}
          <mesh ref={glow} geometry={geoPlano} material={matGlow} scale={[largura * 1.5, altura * 1.25, 1]} position={[0, 0, -0.6]} renderOrder={0} />
          <mesh geometry={geoPlano} material={matSombra} scale={[largura * 1.1, largura * 0.2, 1]} position={[0, -altura / 2 - 0.02, -0.2]} renderOrder={1} />

          {/* origem da pilha na base: o "peso" comprime a partir do chão */}
          <group ref={stack} position={[0, -altura / 2, 0]}>
            {cams.map((cm, i) => (
              <group
                key={cm.nome}
                ref={(g) => {
                  refs.current[i] = g;
                }}
                visible={false}
                position={[cm.x, cm.y + altura / 2, cm.z]}
              >
                <mesh geometry={geoPlano} material={mats[i]} scale={[cm.w, cm.h, 1]} renderOrder={2 + i} />
              </group>
            ))}
          </group>
        </group>
      </group>

      <Particles act={actRef} mobile={mobile} centro={mobile ? -0.4 : 0.2} />
    </>
  );
}
