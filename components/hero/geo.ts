// Geometrias e texturas procedurais do hambúrguer (nenhum asset externo).
import * as THREE from "three";
import { mulberry32 } from "@/lib/rng";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ---------------------------------------------------------------- texturas */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Crosta da carne smash: marrom irregular com pontos escuros e brilhos de gordura. */
export function pattyTexture() {
  const rnd = mulberry32(11);
  return canvasTex(256, 256, (c) => {
    c.fillStyle = "#86563a";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * 256, y = rnd() * 256, r = 0.8 + rnd() * 3.2;
      const k = rnd();
      c.fillStyle = k < 0.55 ? "rgba(30,14,6,0.55)" : k < 0.85 ? "rgba(120,78,46,0.5)" : "rgba(190,130,80,0.45)";
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

/** Ruído suave usado como bump do pão. */
export function bunBumpTexture() {
  const rnd = mulberry32(5);
  return canvasTex(
    128,
    128,
    (c) => {
      c.fillStyle = "#808080";
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) {
        const v = 100 + rnd() * 60;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.beginPath();
        c.arc(rnd() * 128, rnd() * 128, 1 + rnd() * 3, 0, Math.PI * 2);
        c.fill();
      }
    },
    false,
  );
}

/** Listras de gordura do bacon (ao longo do comprimento). */
export function baconTexture() {
  const rnd = mulberry32(23);
  return canvasTex(512, 64, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "#9a2a16");
    g.addColorStop(0.5, "#b3361f");
    g.addColorStop(1, "#8a2410");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 64);
    for (const y of [14, 34, 52]) {
      c.strokeStyle = "rgba(246,214,170,0.78)";
      c.lineWidth = 5 + rnd() * 3;
      c.beginPath();
      for (let x = 0; x <= 512; x += 16) c.lineTo(x, y + Math.sin(x * 0.04 + y) * 3 + (rnd() - 0.5) * 2);
      c.stroke();
    }
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(${40 + rnd() * 40},10,5,0.25)`;
      c.fillRect(rnd() * 512, rnd() * 64, 2 + rnd() * 4, 1 + rnd() * 2);
    }
  });
}

/** Sombra suave redonda (sprite das partículas). */
export function spriteTexture() {
  return canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
}

/* ---------------------------------------------------------------- geometrias */
function paintColors(geo: THREE.BufferGeometry, fn: (x: number, y: number, z: number, nx: number, ny: number, nz: number, out: THREE.Color) => void) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i), c);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
}

/** Pão de cima (cúpula). Origem na base. */
export function makeBunTop(R = 1.28, H = 0.95, seg = 56) {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R * 0.9, 0),
    new THREE.Vector2(R * 0.985, 0.035),
    new THREE.Vector2(R, 0.11),
  ];
  const n = 22;
  for (let i = 1; i <= n; i++) {
    const th = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R * Math.pow(Math.cos(th), 0.82) + 0.0001, 0.11 + (H - 0.11) * Math.pow(Math.sin(th), 0.85)));
  }
  const geo = new THREE.LatheGeometry(pts, seg);
  const lo = new THREE.Color("#f0b457"), hi = new THREE.Color("#b2601a"), miolo = new THREE.Color("#f3d9a0");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    if (ny < -0.6) return void out.copy(miolo);
    const t = clamp((y - 0.1) / (H - 0.1), 0, 1);
    out.copy(lo).lerp(hi, Math.pow(t, 0.7));
    // leve tostado irregular no topo
    out.multiplyScalar(0.94 + 0.08 * Math.sin(x * 5.1 + z * 3.7) * smooth(0.3, 0.9, t));
  });
  return geo;
}

/** Pão de baixo (base). Origem na base. */
export function makeBunBottom(R = 1.26, seg = 56) {
  const pts = [
    [0, 0], [R * 0.86, 0], [R * 0.97, 0.05], [R, 0.16], [R * 0.985, 0.29], [R * 0.95, 0.37], [R * 0.7, 0.385], [R * 0.35, 0.385], [0, 0.385],
  ].map(([x, y]) => new THREE.Vector2(x + 0.0001, y));
  const geo = new THREE.LatheGeometry(pts, seg);
  const lo = new THREE.Color("#d8903a"), hi = new THREE.Color("#e9ae58"), miolo = new THREE.Color("#f3d9a0");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    if (ny < -0.6) return void out.copy(miolo);
    if (ny > 0.9) return void out.set("#d9a45a"); // miolo tostado por cima
    out.copy(lo).lerp(hi, clamp(y / 0.38, 0, 1));
  });
  return geo;
}

/** Carne smash: borda irregular e crocante, topo cheio de relevo. Origem na base. */
export function makePatty(R: number, h: number, seed: number, seg = 84) {
  const rnd = mulberry32(seed);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const pts: [number, number][] = [
    [0, 0], [R * 0.9, 0], [R * 1.0, 0.025], [R * 1.07, 0.09], [R * 1.05, h * 0.75], [R * 0.99, h],
  ];
  for (let k = 9; k >= 0; k--) pts.push([(R * 0.95 * k) / 10 + 0.0001, h]);
  const geo = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x + 0.0001, y)), seg);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z), a = Math.atan2(z, x);
    const rim =
      0.06 * Math.sin(3 * a + ph[0]) + 0.05 * Math.sin(7 * a + ph[1]) + 0.035 * Math.sin(13 * a + ph[2]) + 0.022 * Math.sin(29 * a + ph[3]);
    const k = 1 + rim * smooth(0.5 * R, 1.05 * R, r);
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
    if (y > h * 0.6) {
      const bump = 0.016 * Math.sin(x * 11 + ph[0]) * Math.cos(z * 9 + ph[1]) + 0.01 * Math.sin(x * 23 + z * 19 + ph[2]);
      pos.setY(i, y + bump - 0.03 * smooth(0.82 * R, 1.06 * R, r));
    }
  }
  geo.computeVertexNormals();
  const dark = new THREE.Color("#3a1c0c"), mid = new THREE.Color("#7c4c30"), top = new THREE.Color("#a0683f");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const r = Math.hypot(x, z) / R;
    out.copy(top).lerp(mid, 0.3);
    if (ny < -0.5) out.copy(mid);
    out.lerp(dark, smooth(0.8, 1.08, r) * 0.65);
  });
  return geo;
}

/** Fatia de cheddar: caixa subdividida (derrete deformando os cantos). */
export function makeCheese(size = 2.42, seg = 36) {
  const geo = new THREE.BoxGeometry(size, 0.05, size, seg, 1, seg);
  const base = Float32Array.from(geo.attributes.position.array as ArrayLike<number>);
  return { geo, base };
}

export function meltCheese(geo: THREE.BufferGeometry, base: Float32Array, m: number, phase: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    const rho = Math.hypot(x, z);
    const d = Math.max(0, rho - 1.28);
    const wob = 1 + 0.28 * Math.sin(Math.atan2(z, x) * 3 + phase);
    const drop = Math.pow(d, 1.4) * 1.05 * m * wob;
    const pull = 1 - 0.14 * drop;
    pos.setXYZ(i, x * pull, y - drop, z * pull);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/** Tira de bacon ondulada. */
export function makeBacon(len = 2.9, wid = 0.46, seed = 1, seg = 56) {
  const rnd = mulberry32(seed);
  const ph = rnd() * 6.28;
  const f = 4.6 + rnd() * 1.6;
  const geo = new THREE.BoxGeometry(len, 0.045, wid, seg, 1, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const edge = Math.abs(z) / (wid / 2);
    const wave = 0.075 * Math.sin(x * f + ph) + 0.035 * edge * edge;
    pos.setXYZ(i, x, y + wave, z + 0.045 * Math.sin(x * 2.7 + ph * 2));
  }
  geo.computeVertexNormals();
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const edge = Math.abs(z) / (wid / 2);
    out.set("#ffffff").lerp(new THREE.Color("#5a2310"), smooth(0.7, 1.0, edge) * 0.8);
    out.multiplyScalar(0.85 + 0.15 * Math.sin(x * 9 + ph));
    // pontas mais queimadas
    out.lerp(new THREE.Color("#3a160a"), smooth(len * 0.4, len * 0.5, Math.abs(x)) * 0.7);
  });
  return geo;
}

/** Tira curva de cebola caramelizada (deitada no plano XZ). */
export function makeOnionStrand() {
  const g = new THREE.TorusGeometry(0.13, 0.03, 6, 14, Math.PI * 1.25);
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Pingo de maionese: cápsula com o topo na origem. */
export function makeDrip() {
  const perfil = [[0.0, 0.05], [0.085, 0.04], [0.095, -0.02], [0.07, -0.12], [0.055, -0.2], [0.04, -0.26], [0.0, -0.29]];
  return new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x + 0.0001, y)), 14);
}

/** Montinho de maionese sobre o pão. Origem na base. */
export function makeMayoMound(seg = 48) {
  const perfil = [[0, 0], [1.14, 0], [1.19, 0.02], [1.14, 0.05], [0.9, 0.075], [0.5, 0.095], [0, 0.1]];
  return new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x + 0.0001, y)), seg);
}
