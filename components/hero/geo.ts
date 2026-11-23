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

/** Textura do pão: poros de miolo + manchas de dourado (albedo) e relevo (bump). */
export function bunTextures() {
  const S = 512;
  const mapa = (() => {
    const rnd = mulberry32(31);
    return canvasTex(S, S, (c) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) {
        const x = rnd() * S, y = rnd() * S, r = 18 + rnd() * 60;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        const tom = rnd() < 0.55 ? "150,78,22" : "255,244,210";
        g.addColorStop(0, `rgba(${tom},${0.1 + rnd() * 0.12})`);
        g.addColorStop(1, `rgba(${tom},0)`);
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 1500; i++) {
        c.fillStyle = rnd() < 0.7 ? `rgba(95,45,12,${0.08 + rnd() * 0.14})` : `rgba(255,236,190,${0.1 + rnd() * 0.12})`;
        c.beginPath();
        c.arc(rnd() * S, rnd() * S, 1 + rnd() * 3.2, 0, Math.PI * 2);
        c.fill();
      }
    });
  })();
  const bump = (() => {
    const rnd = mulberry32(53);
    return canvasTex(
      S,
      S,
      (c) => {
        c.fillStyle = "#808080";
        c.fillRect(0, 0, S, S);
        for (let i = 0; i < 90; i++) {
          const x = rnd() * S, y = rnd() * S, r = 24 + rnd() * 70;
          const v = rnd() < 0.5 ? 255 : 0;
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${v},${v},${v},0.18)`);
          g.addColorStop(1, `rgba(${v},${v},${v},0)`);
          c.fillStyle = g;
          c.fillRect(x - r, y - r, r * 2, r * 2);
        }
        for (let i = 0; i < 1900; i++) {
          const v = rnd() < 0.62 ? 40 + rnd() * 50 : 170 + rnd() * 70; // poros fundos e grãos altos
          c.fillStyle = `rgba(${v},${v},${v},0.8)`;
          c.beginPath();
          c.arc(rnd() * S, rnd() * S, 1.2 + rnd() * 3.4, 0, Math.PI * 2);
          c.fill();
        }
      },
      false,
    );
  })();
  return { mapa, bump };
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

/* ---------------------------------------------------------------- pães (realistas) */
/** Ruído suave 3D (soma de senos), valores em ~[-1, 1]. */
const ruido = (x: number, y: number, z: number, s: number) =>
  0.5 * Math.sin(x * 3.1 + s) * Math.cos(z * 2.7 + s * 1.3) + 0.3 * Math.sin(y * 5.3 + x * 2.1 + s * 2) + 0.2 * Math.sin((x + z) * 7.7 + y * 4 + s * 3);

/** Perfil da cúpula do pão de cima: th = 0 na borda, π/2 no topo. Ombro arredondado e topo achatado. */
function perfilTopo(th: number, R: number, H: number): [number, number] {
  const ombro = 1 + 0.045 * Math.sin(Math.min(th * 3.2, Math.PI));
  return [R * Math.pow(Math.cos(th), 0.82) * ombro, 0.11 + (H - 0.11) * Math.pow(Math.sin(th), 0.85)];
}

/** Deformação orgânica: o pão nunca é um torno perfeito. */
function deformarPao(p: THREE.Vector3, H: number, seed: number, altura: number) {
  const a = Math.atan2(p.z, p.x);
  const f = smooth(0.0, 0.35, p.y / H);
  const k = 1 + (0.024 * Math.sin(2 * a + seed) + 0.016 * Math.sin(3 * a + seed * 1.7) + 0.008 * Math.sin(5 * a + seed * 2.3)) * (0.35 + 0.65 * f);
  p.x *= k;
  p.z *= k;
  p.y += altura * ruido(p.x, p.y, p.z, seed) * smooth(0.15, 0.7, p.y / H);
  return p;
}

/** Costura do torno: vértices duplicados precisam da mesma normal, senão aparece uma linha. */
function unirCostura(geo: THREE.BufferGeometry, nPts: number, seg: number) {
  const n = geo.attributes.normal;
  for (let j = 0; j < nPts; j++) {
    const a = j, b = seg * nPts + j;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
}

/** UV sem esticar: planta nas faces horizontais, cilíndrica nas laterais. */
function uvPao(geo: THREE.BufferGeometry, R: number) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  const k = 1 / 0.7;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(nor.getY(i)) > 0.5) uv.set([x * k, z * k], i * 2);
    else uv.set([Math.atan2(z, x) * R * k, y * k * 1.6], i * 2);
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Pão de cima (cúpula brioche). Origem na base. */
export function makeBunTop(R = 1.28, H = 0.95, seg = 56) {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R * 0.9, 0),
    new THREE.Vector2(R * 0.985, 0.035),
    new THREE.Vector2(R, 0.11),
  ];
  const n = 26;
  for (let i = 1; i <= n; i++) {
    const [r, y] = perfilTopo((i / n) * (Math.PI / 2), R, H);
    pts.push(new THREE.Vector2(r + 0.0001, y));
  }
  const geo = new THREE.LatheGeometry(pts, seg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    deformarPao(v, H, 2.1, 0.035);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  unirCostura(geo, pts.length, seg);
  uvPao(geo, R);

  const palido = new THREE.Color("#ecc27a"), ouro = new THREE.Color("#cf8a34"), tosta = new THREE.Color("#9a4c16");
  const miolo = new THREE.Color("#f1d8a2"), torrado = new THREE.Color("#d9a456");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const r = Math.hypot(x, z) / R;
    if (ny < -0.6) return void out.copy(miolo).lerp(torrado, smooth(0.35, 0.95, r) * 0.85); // miolo tostado na chapa
    const t = clamp((y - 0.08) / (H - 0.08), 0, 1);
    out.copy(palido).lerp(ouro, smooth(0.0, 0.45, t)).lerp(tosta, smooth(0.45, 1.0, t) * 0.8);
    // manchas de dourado irregulares (casca) + topo mais escuro
    out.multiplyScalar(0.9 + 0.12 * ruido(x * 1.9, y * 1.7, z * 1.9, 4.2) + 0.05 * Math.sin(x * 9 + z * 7));
    out.lerp(tosta, Math.max(0, ruido(x * 2.6, 0, z * 2.6, 8.7)) * 0.28 * smooth(0.3, 0.9, t));
  });
  return geo;
}

/** Gergelim sobre a cúpula (instâncias; acompanha o pão porque é filho do mesmo grupo). */
export function makeSesame(count: number, R = 1.28, H = 0.95) {
  const rnd = mulberry32(909);
  const geo = new THREE.SphereGeometry(1, 8, 6);
  const mat = new THREE.MeshStandardMaterial({ color: "#f3e2b6", roughness: 0.42, emissive: "#6b4a1c", emissiveIntensity: 0.22 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const pontos: THREE.Vector3[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), s = new THREE.Vector3(), nor = new THREE.Vector3();
  const sMin = Math.sin(0.55), sMax = Math.sin(1.46);
  let i = 0, tent = 0;
  while (i < count && tent++ < 4000) {
    const th = Math.asin(sMin + rnd() * (sMax - sMin)); // área uniforme na cúpula
    const a = rnd() * Math.PI * 2;
    const [r, y] = perfilTopo(th, R, H);
    const e = 0.01;
    const [r2, y2] = perfilTopo(th + e, R, H);
    const nr = y2 - y, ny = -(r2 - r);
    const nl = Math.hypot(nr, ny) || 1;
    nor.set((nr / nl) * Math.cos(a), ny / nl, (nr / nl) * Math.sin(a));
    const p = deformarPao(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)), H, 2.1, 0.035);
    if (pontos.some((o) => o.distanceTo(p) < 0.17)) continue;
    pontos.push(p);
    q.setFromUnitVectors(up, nor);
    q2.setFromAxisAngle(up, rnd() * Math.PI * 2);
    q.multiply(q2);
    const k = 0.85 + rnd() * 0.35;
    s.set(0.062 * k, 0.02 * k, 0.034 * k);
    m.compose(p.clone().addScaledVector(nor, -0.006), q, s);
    mesh.setMatrixAt(i++, m);
  }
  mesh.count = i;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Pão de baixo (base com borda arredondada e miolo tostado). Origem na base. */
export function makeBunBottom(R = 1.26, seg = 56) {
  const pts = [
    [0, 0], [R * 0.84, 0], [R * 0.95, 0.04], [R * 1.01, 0.12], [R * 1.025, 0.22], [R * 1.0, 0.31], [R * 0.95, 0.37], [R * 0.7, 0.385], [R * 0.35, 0.385], [0, 0.385],
  ].map(([x, y]) => new THREE.Vector2(x + 0.0001, y));
  const geo = new THREE.LatheGeometry(pts, seg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    deformarPao(v, 0.8, 5.3, 0.012);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  unirCostura(geo, pts.length, seg);
  uvPao(geo, R);
  const lo = new THREE.Color("#d9a455"), hi = new THREE.Color("#e8b96a"), baixo = new THREE.Color("#c98a3a"), miolo = new THREE.Color("#f1d8a2");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const r = Math.hypot(x, z) / R;
    if (ny < -0.6) return void out.copy(baixo).lerp(miolo, 0.15);
    if (ny > 0.9) return void out.copy(miolo).lerp(new THREE.Color("#d29a4c"), 0.55 + 0.3 * smooth(0.4, 1, r)); // miolo tostado por cima
    out.copy(lo).lerp(hi, clamp(y / 0.38, 0, 1)).lerp(baixo, smooth(0.14, 0.0, y) * 0.8);
    out.multiplyScalar(0.92 + 0.1 * ruido(x * 2, y * 2, z * 2, 6.1));
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
