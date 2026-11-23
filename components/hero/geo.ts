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

/* ---------------------------------------------------------------- ruído (para o pão realista) */
const hash3 = (x: number, y: number, z: number, s: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const suave = (t: number) => t * t * (3 - 2 * t);

/** Ruído de valor 2D que repete a cada P células (a textura emenda sem costura). */
function vn2(x: number, y: number, P: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = suave(x - xi), v = suave(y - yi);
  const m = (a: number) => ((a % P) + P) % P;
  const a = hash3(m(xi), m(yi), 0, s), b = hash3(m(xi + 1), m(yi), 0, s);
  const c = hash3(m(xi), m(yi + 1), 0, s), d = hash3(m(xi + 1), m(yi + 1), 0, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** fBm 2D tileável: P0 células na primeira oitava, dobrando a cada oitava. Resultado em ~[0, 1]. */
function fbm2(px: number, py: number, S: number, P0: number, oct: number, s: number) {
  let sum = 0, amp = 0.5, norm = 0, P = P0;
  for (let o = 0; o < oct; o++) {
    sum += amp * vn2((px / S) * P, (py / S) * P, P, s + o * 7);
    norm += amp;
    amp *= 0.5;
    P *= 2;
  }
  return sum / norm;
}

/** Ruído de valor 3D (para deformar a geometria). */
function vn3(x: number, y: number, z: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = suave(x - xi), v = suave(y - yi), w = suave(z - zi);
  const l = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, s);
  const x00 = l(0, 0, 0) + (l(1, 0, 0) - l(0, 0, 0)) * u;
  const x10 = l(0, 1, 0) + (l(1, 1, 0) - l(0, 1, 0)) * u;
  const x01 = l(0, 0, 1) + (l(1, 0, 1) - l(0, 0, 1)) * u;
  const x11 = l(0, 1, 1) + (l(1, 1, 1) - l(0, 1, 1)) * u;
  const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}
/** fBm 3D em ~[-1, 1]. */
function fbm3(x: number, y: number, z: number, oct: number, s: number) {
  let sum = 0, amp = 0.5, norm = 0, f = 1;
  for (let o = 0; o < oct; o++) {
    sum += amp * (vn3(x * f, y * f, z * f, s + o * 11) * 2 - 1);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

function texDeDados(S: number, srgb: boolean, preencher: (i: number, px: Uint8ClampedArray) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) preencher(i, img.data);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Pele do pão: relevo (normal), manchas de dourado (albedo) e brilho irregular de ovo (rugosidade). */
export function bunTextures(S = 512) {
  const rnd = mulberry32(53);
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const base = fbm2(x, y, S, 6, 5, 3);
      const crista = 1 - Math.abs(2 * vn2((x / S) * 9, (y / S) * 9, 9, 17) - 1);
      h[y * S + x] = base * 0.72 + crista * crista * 0.28;
    }
  }
  // poros e covinhas do miolo aparecendo na casca
  const poro = new Uint8Array(S * S);
  const nPoros = Math.round(S * S * 0.012);
  for (let i = 0; i < nPoros; i++) {
    const cx = (rnd() * S) | 0, cy = (rnd() * S) | 0;
    const rad = 1.6 + rnd() * rnd() * 6.5, prof = 0.12 + rnd() * 0.3;
    const r = Math.ceil(rad);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy) / rad;
        if (d >= 1) continue;
        const k = (1 - d * d) * (1 - d * d);
        const idx = ((cy + dy + S) % S) * S + ((cx + dx + S) % S);
        h[idx] -= prof * k;
        poro[idx] = Math.max(poro[idx], (k * 255) | 0);
      }
  }
  const forca = 11;
  const normal = texDeDados(S, false, (i, px) => {
    const x = i % S, y = (i / S) | 0;
    const g = (xx: number, yy: number) => h[((yy + S) % S) * S + ((xx + S) % S)];
    const nx = (g(x - 1, y) - g(x + 1, y)) * forca, ny = (g(x, y - 1) - g(x, y + 1)) * forca;
    const l = Math.hypot(nx, ny, 1);
    px[i * 4] = ((nx / l) * 0.5 + 0.5) * 255;
    px[i * 4 + 1] = ((ny / l) * 0.5 + 0.5) * 255;
    px[i * 4 + 2] = ((1 / l) * 0.5 + 0.5) * 255;
    px[i * 4 + 3] = 255;
  });
  const mapa = texDeDados(S, true, (i, px) => {
    const x = i % S, y = (i / S) | 0;
    const t = fbm2(x, y, S, 5, 4, 41);
    const fino = vn2((x / S) * 96, (y / S) * 96, 96, 5);
    let v = 0.88 + 0.12 * t + 0.03 * (fino - 0.5);
    v *= 1 - 0.12 * (poro[i] / 255);
    px[i * 4] = v * 255;
    px[i * 4 + 1] = v * 0.955 * 255;
    px[i * 4 + 2] = v * 0.88 * 255;
    px[i * 4 + 3] = 255;
  });
  const rug = texDeDados(S, false, (i, px) => {
    const x = i % S, y = (i / S) | 0;
    let v = fbm2(x, y, S, 4, 4, 91);
    v = 0.42 + 0.58 * suave(clamp((v - 0.3) / 0.45, 0, 1)); // áreas brilhantes (ovo) x foscas
    v = Math.min(1, v + 0.25 * (poro[i] / 255));
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v * 255;
    px[i * 4 + 3] = 255;
  });
  return { normal, mapa, rug };
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
/** Perfil da cúpula do pão de cima: th = 0 na borda, π/2 no topo. Ombro cheio e topo levemente achatado. */
function perfilTopo(th: number, R: number, H: number): [number, number] {
  const ombro = 1 + 0.05 * Math.sin(Math.min(th * 3.2, Math.PI));
  return [R * Math.pow(Math.cos(th), 0.78) * ombro, 0.11 + (H - 0.11) * Math.pow(Math.sin(th), 0.8)];
}

/** Deformação orgânica: massa levedada nunca é um torno perfeito. */
function deformarPao(p: THREE.Vector3, H: number, seed: number, altura: number) {
  const a = Math.atan2(p.z, p.x);
  const f = smooth(0.0, 0.35, p.y / H);
  const ov = 1 + (0.03 * Math.sin(2 * a + seed) + 0.02 * Math.sin(3 * a + seed * 1.7) + 0.01 * Math.sin(5 * a + seed * 2.3)) * (0.3 + 0.7 * f);
  const rr = ov + 0.5 * altura * fbm3(p.x * 1.3, p.y * 1.3, p.z * 1.3, 2, seed | 0) * (0.4 + 0.6 * f);
  p.x *= rr;
  p.z *= rr;
  // covinhas e ondulações da superfície
  p.y += altura * (fbm3(p.x * 2.4, p.y * 2.4, p.z * 2.4, 3, (seed | 0) + 5) * smooth(0.12, 0.6, p.y / H));
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

const LADO_TEX = 1.3; // lado (em unidades do mundo) coberto por uma repetição da textura

/** UV sem esticar: planta nas faces horizontais, cilíndrica nas laterais. */
function uvPao(geo: THREE.BufferGeometry, R: number, nPts: number, seg: number) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  const k = 1 / LADO_TEX;
  const voltas = Math.max(1, Math.round((2 * Math.PI * R) / LADO_TEX)); // número inteiro: a textura fecha a volta sem emenda
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(nor.getY(i)) > 0.5) uv.set([x * k, z * k], i * 2);
    else uv.set([(Math.floor(i / nPts) / seg) * voltas, y * k * 1.6], i * 2);
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Posições do gergelim na cúpula (determinísticas: o pão usa as mesmas para escurecer o contato). */
function pontosGergelim(count: number, R: number, H: number) {
  const rnd = mulberry32(909);
  const pts: { p: THREE.Vector3; n: THREE.Vector3; spin: number; k: number }[] = [];
  const sMin = Math.sin(0.5), sMax = Math.sin(1.45);
  let tent = 0;
  while (pts.length < count && tent++ < 6000) {
    const th = Math.asin(sMin + rnd() * (sMax - sMin)); // área uniforme na cúpula
    const a = rnd() * Math.PI * 2;
    const [r, y] = perfilTopo(th, R, H);
    const [r2, y2] = perfilTopo(th + 0.01, R, H);
    const nr = y2 - y, ny = -(r2 - r);
    const nl = Math.hypot(nr, ny) || 1;
    const n = new THREE.Vector3((nr / nl) * Math.cos(a), ny / nl, (nr / nl) * Math.sin(a));
    const p = deformarPao(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)), H, 2.1, 0.05);
    const spin = rnd() * Math.PI * 2, k = 0.85 + rnd() * 0.4;
    if (pts.some((o) => o.p.distanceTo(p) < 0.16)) continue;
    pts.push({ p, n, spin, k });
  }
  return pts;
}

/** Pão de cima (cúpula brioche). Origem na base. */
export function makeBunTop(R = 1.28, H = 0.95, seg = 56, nGergelim = 0) {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R * 0.9, 0),
    new THREE.Vector2(R * 0.985, 0.035),
    new THREE.Vector2(R, 0.11),
  ];
  const n = Math.round(seg * 0.55);
  for (let i = 1; i <= n; i++) {
    const [r, y] = perfilTopo((i / n) * (Math.PI / 2), R, H);
    pts.push(new THREE.Vector2(r + 0.0001, y));
  }
  const geo = new THREE.LatheGeometry(pts, seg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    deformarPao(v, H, 2.1, 0.05);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  unirCostura(geo, pts.length, seg);
  uvPao(geo, R, pts.length, seg);

  const sementes = nGergelim ? pontosGergelim(nGergelim, R, H) : [];
  const palido = new THREE.Color("#dc9648"), ouro = new THREE.Color("#c3611b"), tosta = new THREE.Color("#a03e0e");
  const queima = new THREE.Color("#74270a"), miolo = new THREE.Color("#f0d6a0"), torrado = new THREE.Color("#d29a4a");
  const tmp = new THREE.Vector3();
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const r = Math.hypot(x, z) / R;
    if (ny < -0.6) return void out.copy(miolo).lerp(torrado, smooth(0.35, 0.95, r) * 0.85); // miolo tostado na chapa
    const t = clamp((y - 0.08) / (H - 0.08), 0, 1);
    // dourado: pálido nas laterais, âmbar no ombro, marrom no topo
    out.copy(palido).lerp(ouro, smooth(0.02, 0.5, t)).lerp(tosta, smooth(0.5, 1.0, t) * 0.75);
    // manchas de assadura (pinceladas de ovo + áreas mais torradas)
    const a = Math.atan2(z, x);
    const mancha = fbm3(x * 1.7, y * 1.7, z * 1.7, 3, 8);
    const pincel = fbm3(Math.cos(a) * 2.6, y * 0.9, Math.sin(a) * 2.6, 2, 21);
    out.multiplyScalar(0.9 + 0.2 * mancha + 0.07 * pincel);
    out.lerp(queima, clamp(mancha * 0.9 - 0.12, 0, 1) * 0.38 * smooth(0.25, 0.85, t));
    out.lerp(palido, clamp(-mancha - 0.25, 0, 1) * 0.4);
    // sombra de contato na base do pão
    out.multiplyScalar(0.8 + 0.2 * smooth(0.0, 0.2, t));
    // sombra de contato em volta de cada gergelim
    tmp.set(x, y, z);
    for (const s of sementes) {
      const d = s.p.distanceTo(tmp);
      if (d < 0.11) out.multiplyScalar(1 - 0.3 * (1 - d / 0.11));
    }
  });
  return geo;
}

/** Gergelim sobre a cúpula (instâncias; acompanha o pão porque é filho do mesmo grupo). */
export function makeSesame(count: number, R = 1.28, H = 0.95) {
  const geo = new THREE.SphereGeometry(1, 12, 8);
  const gp = geo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), y = gp.getY(i), z = gp.getZ(i);
    const bico = 1 - 0.5 * smooth(0.1, 1, x); // uma ponta mais fina, como a semente de verdade
    gp.setXYZ(i, x, (y < 0 ? y * 0.55 : y * (1 + 0.15 * (1 - Math.abs(x)))) * bico, z * bico);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4, metalness: 0, emissive: "#5a3b12", emissiveIntensity: 0.18 });
  const pts = pontosGergelim(count, R, H);
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), s = new THREE.Vector3();
  const paleta = ["#f1e0b6", "#ead6a4", "#e2c88e", "#d6b57c"].map((c) => new THREE.Color(c));
  const rnd = mulberry32(31);
  pts.forEach((o, i) => {
    q.setFromUnitVectors(up, o.n);
    q2.setFromAxisAngle(up, o.spin);
    q.multiply(q2);
    s.set(0.068 * o.k, 0.024 * o.k, 0.037 * o.k);
    m.compose(o.p.clone().addScaledVector(o.n, -0.004), q, s);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, paleta[Math.floor(Math.pow(rnd(), 1.5) * paleta.length)]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

/** Pão de baixo (base com borda arredondada e miolo tostado). Origem na base. */
export function makeBunBottom(R = 1.26, seg = 56) {
  const pts = [
    [0, 0], [R * 0.84, 0], [R * 0.95, 0.04], [R * 1.01, 0.12], [R * 1.03, 0.22], [R * 1.01, 0.31], [R * 0.95, 0.37], [R * 0.7, 0.385], [R * 0.35, 0.385], [0, 0.385],
  ].map(([x, y]) => new THREE.Vector2(x + 0.0001, y));
  const geo = new THREE.LatheGeometry(pts, seg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    deformarPao(v, 0.8, 5.3, 0.02);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  unirCostura(geo, pts.length, seg);
  uvPao(geo, R, pts.length, seg);
  const lo = new THREE.Color("#cf8a3c"), hi = new THREE.Color("#e0a050"), baixo = new THREE.Color("#a8672a"), miolo = new THREE.Color("#f0d6a0"), toste = new THREE.Color("#c4853a");
  paintColors(geo, (x, y, z, nx, ny, nz, out) => {
    const r = Math.hypot(x, z) / R;
    if (ny < -0.6) return void out.copy(baixo).lerp(miolo, 0.15);
    if (ny > 0.9) return void out.copy(miolo).lerp(toste, 0.7 + 0.25 * smooth(0.4, 1, r)).multiplyScalar(0.82 + 0.3 * (fbm3(x * 6, 0, z * 6, 3, 14) * 0.5 + 0.5)); // miolo tostado por cima (chapa)
    out.copy(lo).lerp(hi, clamp(y / 0.38, 0, 1)).lerp(baixo, smooth(0.14, 0.0, y) * 0.85);
    const mancha = fbm3(x * 2, y * 2, z * 2, 3, 6);
    out.multiplyScalar(0.92 + 0.16 * mancha);
    out.multiplyScalar(0.82 + 0.18 * smooth(0.0, 0.12, y)); // sombra de contato junto à tábua
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
    const d = Math.max(0, rho - 1.26);
    const a = Math.atan2(z, x);
    const wob = 1 + 0.4 * Math.sin(a * 3 + phase) + 0.18 * Math.sin(a * 7 + phase * 2);
    const bruto = Math.pow(d, 1.25) * 1.45 * m * wob;
    const drop = 0.5 * (1 - Math.exp(-bruto / 0.5)); // escorre e para (limite suave)
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
