/* eslint-disable react-hooks/immutability */
"use client";

/* Hambúrguer 3D que se monta sozinho (linha do tempo por TEMPO, nunca por rolagem).
   Tudo é procedural (sem modelos externos). Ver geo.ts para as geometrias. */

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";
import {
  baconTexture,
  bunTextures,
  makeBacon,
  makeBunBottom,
  makeBunTop,
  makeCheese,
  makeDrip,
  makeMayoMound,
  makeOnionStrand,
  makeSesame,
  makePatty,
  meltCheese,
  pattyTexture,
} from "./geo";
import Particles from "./Particles";

/* ------------------------------------------------------------ tipos compartilhados */
export type Ctl = { start: number | null; frozen: number | null; run: number; reduced: boolean };
export type Input = { px: number; py: number; dx: number; drag: boolean };
export type Stage = { labels: (HTMLElement | null)[]; lines: (SVGLineElement | null)[]; w: number[] };

/* ------------------------------------------------------------ alturas (origem de cada camada) */
const Y = { bunB: 0, mayo: 0.385, p1: 0.44, c1: 0.69, p2: 0.715, c2: 0.96, bacon: 1.04, onion: 1.08, bunT: 1.2 };
const TOPO = 2.14;
const CENTRO = TOPO / 2;

/* Quando cada ingrediente é solto (s). Todos dentro de ~5 s. */
const T = { bunB: 0.0, mayo: 0.55, p1: 0.95, c1: 1.4, p2: 1.85, c2: 2.3, bacon: 2.75, onion: 3.2, bunT: 3.85 };
const G = 40; // gravidade da queda

/* Etiquetas: texto, camada, quando surgem (depois de cair), lado e altura-âncora. */
export const LABELS = [
  { txt: "PÃO BRIOCHE", at: T.bunB, y: 0.2, side: 1, desktop: true },
  { txt: "MAIONESE DA CASA", at: T.mayo - 0.1, y: 0.42, side: -1, desktop: true },
  { txt: "SMASH 120G", at: T.p1, y: 0.55, side: 1, desktop: false },
  { txt: "CHEDDAR", at: T.c1, y: 0.69, side: -1, desktop: true },
  { txt: "DUPLO SMASH", at: T.p2, y: 0.83, side: 1, desktop: true },
  { txt: "CHEDDAR DUPLO", at: T.c2, y: 0.97, side: -1, desktop: false, dyM: 14 },
  { txt: "BACON", at: T.bacon + 0.1, y: 1.08, side: 1, desktop: false },
  { txt: "CEBOLA CARAMELIZADA", at: T.onion + 0.25, y: 1.2, side: -1, desktop: false, dyM: -16 },
  { txt: "PÃO BRIOCHE", at: T.bunT, y: 1.7, side: 1, desktop: false },
] as const;

/* ------------------------------------------------------------ física */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 2.2, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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

type Pose = { rx: number; ry: number; rz: number; ox: number; oz: number; amp: number; fx: number; fz: number; base: number };

function placeDrop(o: THREE.Object3D | null, s: number, y: number, p: Pose, H: number) {
  if (!o) return;
  if (s < 0) {
    o.visible = false;
    return;
  }
  o.visible = true;
  const d = drop(s, H);
  const k = d.since < 0 ? Math.pow(1 - d.f, 1.6) : 0; // giro/deslocamento some ao encostar
  o.position.set(p.fx + p.ox * k, y + d.off, p.fz + p.oz * k);
  let wob = 0;
  let sq = 0;
  if (d.since >= 0) {
    wob = Math.exp(-d.since * 7) * Math.sin(d.since * 22);
    sq = p.amp * Math.exp(-d.since * 9) * Math.cos(d.since * 26);
  }
  o.rotation.set(p.rx * k + p.rz * 0.06 * wob, p.base + p.ry * k, p.rz * k + p.rx * 0.06 * wob);
  o.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
}

/* ------------------------------------------------------------ cena */
type Props = {
  ctl: MutableRefObject<Ctl>;
  input: MutableRefObject<Input>;
  stage: MutableRefObject<Stage>;
  mobile: boolean;
};

export default function BurgerScene({ ctl, input, stage, mobile }: Props) {
  const sh = !mobile;

  /* materiais e geometrias (criados uma vez) */
  const R = useMemo(() => {
    const seg = mobile ? 40 : 64;
    const cs = mobile ? 30 : 36;
    const rnd = mulberry32(77);
    const pao = bunTextures();
    const pt = pattyTexture();
    pt.repeat.set(3, 1);
    const bt = baconTexture();
    const mk = (seed: number, amp: number): Pose => ({
      rx: (rnd() - 0.5) * 1.0, ry: (rnd() - 0.5) * 3.2, rz: (rnd() - 0.5) * 1.0,
      ox: (rnd() - 0.5) * 1.0, oz: (rnd() - 0.5) * 1.0, amp, fx: 0, fz: 0, base: seed,
    });
    const ch1 = makeCheese(2.42, cs);
    const ch2 = makeCheese(2.42, cs);
    const N = mobile ? 40 : 72;
    const onion = Array.from({ length: N }, (_, i) => {
      const a = rnd() * Math.PI * 2, r = 0.3 + Math.sqrt(rnd()) * 0.8;
      return {
        x: Math.cos(a) * r, z: Math.sin(a) * r, y: rnd() * 0.07,
        ry: rnd() * 6.28, tx: (rnd() - 0.5) * 0.3, tz: (rnd() - 0.5) * 0.3,
        s: 0.8 + rnd() * 0.7, delay: (i / N) * 0.38 + rnd() * 0.06, spin: (rnd() - 0.5) * 8,
      };
    });
    return {
      geo: {
        bunT: makeBunTop(1.28, 0.95, seg),
        bunB: makeBunBottom(1.26, seg),
        sesame: makeSesame(mobile ? 62 : 110),
        p1: makePatty(1.27, 0.22, 3, mobile ? 56 : 84),
        p2: makePatty(1.25, 0.22, 9, mobile ? 56 : 84),
        mound: makeMayoMound(seg),
        drip: makeDrip(),
        onion: makeOnionStrand(),
        bacon: [makeBacon(2.9, 0.46, 1), makeBacon(2.8, 0.44, 4), makeBacon(3.0, 0.47, 8)],
        board: new THREE.CylinderGeometry(2.3, 2.34, 0.12, 64),
      },
      ch1,
      ch2,
      mat: {
        bun: new THREE.MeshPhysicalMaterial({ vertexColors: true, map: pao.mapa, bumpMap: pao.bump, bumpScale: 1.5, roughness: 0.58, clearcoat: 0.5, clearcoatRoughness: 0.34, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffd9a0") }),
        patty: new THREE.MeshStandardMaterial({ vertexColors: true, map: pt, bumpMap: pt, bumpScale: 1.6, roughness: 0.7, metalness: 0.02, emissive: "#2a1006", emissiveIntensity: 0.35 }),
        cheese: new THREE.MeshPhysicalMaterial({ color: "#f8a817", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.25, emissive: "#b35a00", emissiveIntensity: 0.28, sheen: 0.6, sheenColor: new THREE.Color("#ffd56b") }),
        mayo: new THREE.MeshPhysicalMaterial({ color: "#fff1d0", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, emissive: "#6b5a38", emissiveIntensity: 0.2 }),
        onion: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.2, emissive: "#3b1a00", emissiveIntensity: 0.35 }),
        bacon: new THREE.MeshPhysicalMaterial({ vertexColors: true, map: bt, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
        board: new THREE.MeshStandardMaterial({ color: "#2b1a10", roughness: 0.72, metalness: 0.05 }),
      },
      pose: {
        bunT: mk(rnd() * 6.28, 0.14),
        bunB: mk(0, 0.1),
        p1: mk(rnd() * 6.28, 0.07),
        p2: mk(rnd() * 6.28, 0.07),
        c1: { ...mk(Math.PI / 4, 0.05) },
        c2: { ...mk(Math.PI / 4 + 0.42, 0.05) },
        bacon: [
          { ...mk(-0.5, 0.05), fx: 0, fz: -0.4 },
          { ...mk(0.16, 0.05), fx: 0, fz: 0.0 },
          { ...mk(0.72, 0.05), fx: 0, fz: 0.42 },
        ],
      },
      onion,
      N,
    };
  }, [mobile]);

  /* refs dos objetos animados */
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);
  const gBunB = useRef<THREE.Group>(null);
  const gBunT = useRef<THREE.Group>(null);
  const gP1 = useRef<THREE.Group>(null);
  const gP2 = useRef<THREE.Group>(null);
  const gC1 = useRef<THREE.Group>(null);
  const gC2 = useRef<THREE.Group>(null);
  const mC1 = useRef<THREE.Mesh>(null);
  const mC2 = useRef<THREE.Mesh>(null);
  const gBacon = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const gMayo = useRef<THREE.Group>(null);
  const mMound = useRef<THREE.Mesh>(null);
  const drips = useRef<(THREE.Mesh | null)[]>([]);
  const onionMesh = useRef<THREE.InstancedMesh>(null);

  /* estado mutável do loop */
  const st = useRef({ rotY: 0.32, vel: 0, run: -1, m1: -1, m2: -1, act: 0, onionDone: false, time: 0, t: 0 });
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), v: new THREE.Vector3(), v2: new THREE.Vector3(), col: new THREE.Color(), c1: new THREE.Color("#6e3510"), c2: new THREE.Color("#cf9234") }), []);
  const dripAngles = useMemo(() => Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2 + 0.3), []);

  /* cores individuais da cebola (uma vez, quando o InstancedMesh existe) */
  const colored = useRef(false);

  const actRef = useRef(0);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = ctl.current;
    const s = st.current;
    const { camera, size } = state;
    s.time += dt;

    if (s.run !== c.run) {
      s.run = c.run;
      s.t = 0;
      s.rotY = 0.32;
      s.vel = 0;
      s.onionDone = false;
      s.m1 = s.m2 = -1;
    }

    /* relógio da montagem: avança por quadro (limitado), assim um engasgo de carregamento não pula a animação */
    let t = -1;
    if (c.frozen != null) t = c.frozen;
    else if (c.start != null && performance.now() >= c.start) {
      s.t += Math.min(rawDt, 0.1);
      t = c.reduced ? 999 : s.t;
    }

    /* câmera: enquadramento responsivo, vista 3/4 de cima */
    const aspect = size.width / size.height;
    const Hv = mobile ? 5.5 / aspect : Math.max(6.3, 8.6 / aspect);
    const cam = camera as THREE.PerspectiveCamera;
    const dist = Hv / 2 / Math.tan((cam.fov * Math.PI) / 360);
    const el = mobile ? 0.5 : 0.3;
    const ty = mobile ? -0.4 : -0.3;
    cam.position.set(0, ty + Math.sin(el) * dist, Math.cos(el) * dist);
    cam.lookAt(0, ty, 0);
    cam.updateMatrixWorld();

    const H = Math.max(4.4, Hv * 0.5 + 2.6); // altura da queda (nasce fora do quadro)
    const tf = Math.sqrt((2 * H) / G); // tempo de queda
    const pronto = T.bunT + tf + 0.55; // hambúrguer montado
    const act = c.reduced ? 1 : smooth(pronto, pronto + 1.2, t);
    s.act = act;
    actRef.current = act;

    /* ---- peças que caem ---- */
    placeDrop(gBunB.current, t - T.bunB, Y.bunB, R.pose.bunB, H);
    placeDrop(gP1.current, t - T.p1, Y.p1, R.pose.p1, H);
    placeDrop(gC1.current, t - T.c1, Y.c1, R.pose.c1, H);
    placeDrop(gP2.current, t - T.p2, Y.p2, R.pose.p2, H);
    placeDrop(gC2.current, t - T.c2, Y.c2, R.pose.c2, H);
    for (let i = 0; i < 3; i++) placeDrop(gBacon[i].current, t - (T.bacon + i * 0.09), Y.bacon + i * 0.028, R.pose.bacon[i], H);
    placeDrop(gBunT.current, t - T.bunT, Y.bunT, R.pose.bunT, H);

    /* ---- queijo derretendo ---- */
    const melt = (mesh: THREE.Mesh | null, base: Float32Array, start: number, key: "m1" | "m2", ph: number) => {
      if (!mesh) return;
      const m = easeOutCubic(clamp((t - (start + tf + 0.12)) / 1.0, 0, 1));
      if (Math.abs(m - s[key]) > 0.002) {
        s[key] = m;
        meltCheese(mesh.geometry, base, m, ph);
      }
    };
    melt(mC1.current, R.ch1.base, T.c1, "m1", 0.4);
    melt(mC2.current, R.ch2.base, T.c2, "m2", 2.1);

    /* ---- maionese escorrendo ---- */
    const g = gMayo.current;
    if (g) {
      g.visible = t >= T.mayo;
      const m = clamp((t - T.mayo) / 0.7, 0, 1);
      const sc = easeOutBack(m);
      mMound.current?.scale.set(sc, Math.max(0.01, sc), sc);
      drips.current.forEach((d, i) => {
        if (!d) return;
        const dm = clamp((t - T.mayo - 0.22 - i * 0.07) / 0.75, 0, 1);
        d.scale.set(1, Math.max(0.001, easeOutCubic(dm) * (0.7 + 0.5 * ((i * 37) % 10) / 10)), 1);
      });
    }

    /* ---- cebola caramelizada (cada tira cai com atraso próprio) ---- */
    const om = onionMesh.current;
    if (om) {
      if (!colored.current) {
        colored.current = true;
        R.onion.forEach((o, i) => om.setColorAt(i, tmp.col.copy(tmp.c1).lerp(tmp.c2, (Math.sin(i * 12.9898) * 0.5 + 0.5))));
        if (om.instanceColor) om.instanceColor.needsUpdate = true;
      }
      const fim = T.onion + 0.5 + 3;
      if (t < T.onion || t < fim || !s.onionDone) {
        const d = tmp.o;
        for (let i = 0; i < R.N; i++) {
          const o = R.onion[i];
          const ss = t - T.onion - o.delay;
          if (ss < 0) {
            d.position.set(0, -50, 0);
            d.scale.setScalar(0.0001);
          } else {
            const dr = drop(ss, H - 0.6);
            const k = dr.since < 0 ? 1 - dr.f : 0;
            d.position.set(o.x, Y.onion + o.y + dr.off, o.z);
            d.rotation.set(o.tx + k * 2, o.ry + o.spin * k, o.tz + k * 2);
            d.scale.setScalar(o.s);
          }
          d.updateMatrix();
          om.setMatrixAt(i, d.matrix);
        }
        om.instanceMatrix.needsUpdate = true;
        if (t >= fim) s.onionDone = true;
      }
    }

    /* ---- rotação: arrastar, inércia, giro lento e inclinação com o cursor ---- */
    const inp = input.current;
    if (inp.drag || Math.abs(inp.dx) > 0) {
      const d = inp.dx * 0.011;
      s.rotY += d;
      s.vel = dt > 0 ? THREE.MathUtils.lerp(s.vel, d / dt, 0.4) : 0;
      inp.dx = 0;
    } else {
      const alvo = c.reduced || c.frozen != null ? 0 : act * 0.42;
      s.vel += (alvo - s.vel) * (1 - Math.exp(-dt * 1.4));
      s.rotY += s.vel * dt;
    }
    if (spin.current) spin.current.rotation.y = s.rotY;

    const o = outer.current;
    if (o) {
      const k = 1 - Math.exp(-dt * 5);
      o.rotation.x += (inp.py * 0.14 - o.rotation.x) * k;
      o.rotation.z += (-inp.px * 0.07 - o.rotation.z) * k;
      o.position.y = c.reduced ? 0 : Math.sin(s.time * 1.5) * 0.05 * act;
      o.updateMatrixWorld(true);
    }

    /* ---- etiquetas HTML ligadas aos ingredientes por linhas finas ---- */
    const stk = stack.current;
    const lb = stage.current;
    if (stk && lb.labels.length) {
      const gone = pronto + 1.4;
      const colX = mobile ? 1.5 : 2.08;
      for (let i = 0; i < LABELS.length; i++) {
        const L = LABELS[i];
        const el = lb.labels[i], ln = lb.lines[i];
        if (!el || !ln) continue;
        if (mobile && L.desktop) continue; // no celular só as etiquetas principais
        const on = t >= L.at + tf && t < gone;
        const off = t >= gone;
        el.classList.toggle("on", on);
        el.classList.toggle("off", off);
        ln.classList.toggle("on", on);
        ln.classList.toggle("off", off);
        if (!on) continue;
        const dy = mobile ? (("dyM" in L ? L.dyM : 0) as number) : 0;
        tmp.v.set(L.side * 1.28, L.y, 0);
        stk.localToWorld(tmp.v);
        tmp.v.project(camera);
        const ax = (tmp.v.x * 0.5 + 0.5) * size.width;
        const ay = (-tmp.v.y * 0.5 + 0.5) * size.height;
        tmp.v2.set(L.side * colX, L.y, 0);
        stk.localToWorld(tmp.v2);
        tmp.v2.project(camera);
        const wdt = lb.w[i] || (lb.w[i] = el.offsetWidth);
        let bx = (tmp.v2.x * 0.5 + 0.5) * size.width + L.side * 10;
        // mantém a etiqueta sempre dentro da tela (celulares estreitos)
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
      {/* iluminação de estúdio: luz principal quente, recorte laranja atrás, preenchimento suave */}
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[3.2, 6.5, 4.2]}
        intensity={2.5}
        color="#ffd9a8"
        castShadow={sh}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
      <directionalLight position={[-4.5, 3.2, -5]} intensity={2.6} color="#ff7a18" />
      <directionalLight position={[-4, 1.2, 3.5]} intensity={0.55} color="#ffb36b" />
      <directionalLight position={[4.5, 2, -4]} intensity={1.1} color="#ff5a2a" />

      <Environment resolution={256} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={4.5} color="#ffe2b8" position={[0, 6, 3]} scale={[9, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[-6, 2, 3]} scale={[1.5, 6, 1]} />
        <Lightformer form="rect" intensity={5} color="#ff7a1a" position={[5, 2.5, -5]} scale={[2, 7, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#ffb067" position={[0, 0.5, -7]} scale={6} />
        <Lightformer form="rect" intensity={1.4} color="#b3261e" position={[0, -2, 6]} scale={[10, 1.6, 1]} />
      </Environment>

      <group ref={outer}>
        <group ref={spin} rotation={[0, 0.32, 0]}>
          <group ref={stack} position={[0, -CENTRO, 0]}>
            {/* tábua */}
            <mesh geometry={R.geo.board} material={R.mat.board} position={[0, -0.06, 0]} receiveShadow />

            <group ref={gBunB} visible={false}>
              <mesh geometry={R.geo.bunB} material={R.mat.bun} castShadow={sh} receiveShadow={sh} />
            </group>

            <group ref={gMayo} position={[0, Y.mayo, 0]} visible={false}>
              <mesh ref={mMound} geometry={R.geo.mound} material={R.mat.mayo} castShadow={sh} />
              {dripAngles.map((a, i) => (
                <mesh
                  key={i}
                  ref={(m) => {
                    drips.current[i] = m;
                  }}
                  geometry={R.geo.drip}
                  material={R.mat.mayo}
                  position={[Math.cos(a) * 1.23, 0.0, Math.sin(a) * 1.23]}
                  scale={[1, 0.001, 1]}
                />
              ))}
            </group>

            <group ref={gP1} visible={false}>
              <mesh geometry={R.geo.p1} material={R.mat.patty} castShadow={sh} receiveShadow={sh} />
            </group>
            <group ref={gC1} visible={false}>
              <mesh ref={mC1} geometry={R.ch1.geo} material={R.mat.cheese} castShadow={sh} receiveShadow={sh} />
            </group>
            <group ref={gP2} visible={false}>
              <mesh geometry={R.geo.p2} material={R.mat.patty} castShadow={sh} receiveShadow={sh} />
            </group>
            <group ref={gC2} visible={false}>
              <mesh ref={mC2} geometry={R.ch2.geo} material={R.mat.cheese} castShadow={sh} receiveShadow={sh} />
            </group>

            {[0, 1, 2].map((i) => (
              <group key={i} ref={gBacon[i]} visible={false}>
                <mesh geometry={R.geo.bacon[i]} material={R.mat.bacon} castShadow={sh} receiveShadow={sh} />
              </group>
            ))}

            <instancedMesh ref={onionMesh} args={[R.geo.onion, R.mat.onion, R.N]} castShadow={sh} frustumCulled={false} />

            <group ref={gBunT} visible={false}>
              <mesh geometry={R.geo.bunT} material={R.mat.bun} castShadow={sh} receiveShadow={sh} />
              <primitive object={R.geo.sesame} castShadow={sh} />
            </group>
          </group>
        </group>
      </group>

      <Particles act={actRef} mobile={mobile} centro={CENTRO} />
    </>
  );
}
