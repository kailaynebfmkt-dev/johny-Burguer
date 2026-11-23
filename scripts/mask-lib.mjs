// utilitários de máscara (recorte do hambúrguer sobre fundo escuro)
import sharp from "sharp";

export const DL = process.env.USERPROFILE.replace(/\\/g, "/") + "/Downloads/";

export async function carregar(arquivo) {
  const { data, info } = await sharp(DL + arquivo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** 1 onde o pixel é "claro o bastante" e está dentro da região. */
export function binarizar(img, limiar, regiao) {
  const { data, w, h } = img;
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (regiao && !regiao(x, y)) continue;
      const i = (y * w + x) * 3;
      const l = Math.max(data[i], data[i + 1], data[i + 2]);
      if (l > limiar(x, y)) m[y * w + x] = 1;
    }
  return m;
}

export function erodir(m, w, h, r) {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 1;
      for (let k = -r; k <= r && v; k++) { const xx = x + k; if (xx < 0 || xx >= w || !m[y * w + xx]) v = 0; }
      t[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 1;
      for (let k = -r; k <= r && v; k++) { const yy = y + k; if (yy < 0 || yy >= h || !t[yy * w + x]) v = 0; }
      o[y * w + x] = v;
    }
  return o;
}

export function dilatar(m, w, h, r) {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w && m[y * w + xx]) v = 1; }
      t[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h && t[yy * w + x]) v = 1; }
      o[y * w + x] = v;
    }
  return o;
}

/** Mantém só componentes conectados com área >= minArea. */
export function manterGrandes(m, w, h, minArea) {
  const lab = new Int32Array(w * h), out = new Uint8Array(w * h);
  const pilha = new Int32Array(w * h);
  let n = 0;
  for (let s = 0; s < w * h; s++) {
    if (!m[s] || lab[s]) continue;
    n++;
    let topo = 0, cont = 0;
    pilha[topo++] = s; lab[s] = n;
    const lista = [];
    while (topo) {
      const p = pilha[--topo]; lista.push(p); cont++;
      const x = p % w, y = (p / w) | 0;
      if (x > 0 && m[p - 1] && !lab[p - 1]) { lab[p - 1] = n; pilha[topo++] = p - 1; }
      if (x < w - 1 && m[p + 1] && !lab[p + 1]) { lab[p + 1] = n; pilha[topo++] = p + 1; }
      if (y > 0 && m[p - w] && !lab[p - w]) { lab[p - w] = n; pilha[topo++] = p - w; }
      if (y < h - 1 && m[p + w] && !lab[p + w]) { lab[p + w] = n; pilha[topo++] = p + w; }
    }
    if (cont >= minArea) for (const p of lista) out[p] = 1;
  }
  return out;
}

/** Preenche buracos: o que não é alcançado pelo fundo (a partir das bordas) vira sólido. */
export function preencherBuracos(m, w, h) {
  const visto = new Uint8Array(w * h), pilha = new Int32Array(w * h);
  let topo = 0;
  const empurra = (p) => { if (!m[p] && !visto[p]) { visto[p] = 1; pilha[topo++] = p; } };
  for (let x = 0; x < w; x++) { empurra(x); empurra((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { empurra(y * w); empurra(y * w + w - 1); }
  while (topo) {
    const p = pilha[--topo]; const x = p % w, y = (p / w) | 0;
    if (x > 0) empurra(p - 1);
    if (x < w - 1) empurra(p + 1);
    if (y > 0) empurra(p - w);
    if (y < h - 1) empurra(p + w);
  }
  const out = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) out[p] = m[p] || !visto[p] ? 1 : 0;
  return out;
}

/** Aplica a máscara (0/1 ou 0..255) como canal alfa, com leve desfoque nas bordas. */
export async function recortar(img, alfa255, caixa, desfoque = 1.1) {
  const { data, w, h } = img;
  const a = Buffer.from(alfa255);
  const { data: alfaImg, info: ia } = await sharp(a, { raw: { width: w, height: h, channels: 1 } }).blur(desfoque).raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    rgba[p * 4] = data[p * 3]; rgba[p * 4 + 1] = data[p * 3 + 1]; rgba[p * 4 + 2] = data[p * 3 + 2]; rgba[p * 4 + 3] = alfaImg[p * ia.channels];
  }
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).extract(caixa);
}
