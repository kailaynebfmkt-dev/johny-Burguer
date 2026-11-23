// Recorta as camadas do hambúrguer a partir das fotos de referência do cliente (em Downloads)
// e grava public/img/burger/*.webp (com transparência) + lib/burger-layout.json.
// Uso: node scripts/prepare-burger-layers.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { carregar, binarizar, erodir, dilatar, manterGrandes, preencherBuracos, recortar } from "./mask-lib.mjs";

const SAIDA = "public/img/burger/";
const PREVIA = process.env.PREVIA; // caminho opcional para uma prévia da pilha montada
mkdirSync(SAIDA, { recursive: true });

const exp = await carregar("Hambúrguer Explodido com Bacon e Cheddar.png"); // camadas separadas
const mon = await carregar("Hambúrguer Triplo com Bacon Crocante.png"); // topo do pão visto de fora
const { w, h } = exp;

/* ---------- utilidades ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function poligono(pts, W, H) {
  // preenchimento por varredura (par-ímpar)
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) if (x >= 0 && x < W) m[y * W + x] = 1;
  }
  return m;
}
function elipse(cx, cy, rx, ry, W, H) {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) m[y * W + x] = 1;
  return m;
}
const ou = (a, b) => a.map((v, i) => (v || b[i] ? 1 : 0));
const lum = (img, x, y) => { const i = (y * img.w + x) * 3; return Math.max(img.data[i], img.data[i + 1], img.data[i + 2]); };

/* ---------- 1) bloco do meio (topping + carnes + queijos) da foto explodida ---------- */
let bloco = binarizar(exp, () => 62, (x, y) => y < 1112 && x > 60 && x < 1060);
bloco = erodir(bloco, w, h, 1);
bloco = dilatar(bloco, w, h, 1);
bloco = manterGrandes(bloco, w, h, 4000);
// só o componente grande do meio (não o pão de cima nem a fumaça)
{
  const alvo = new Uint8Array(w * h);
  const ini = 600 * w + 560; // um ponto dentro do bloco (bacon)
  const pilha = [];
  if (bloco[ini]) { pilha.push(ini); alvo[ini] = 1; }
  while (pilha.length) {
    const p = pilha.pop(); const x = p % w;
    for (const q of [p - 1, p + 1, p - w, p + w]) if (q >= 0 && q < w * h && bloco[q] && !alvo[q] && Math.abs((q % w) - x) <= 1) { alvo[q] = 1; pilha.push(q); }
  }
  bloco = alvo;
}
// parte de baixo da carne: o fundo tem brilho de fumaça, então usamos o contorno desenhado à mão
// (a base da carne fica escura e o limiar a perderia)
const baseCarne = poligono([[176, 905], [978, 905], [980, 1005], [958, 1036], [880, 1050], [760, 1060], [620, 1062], [470, 1064], [330, 1068], [230, 1048], [178, 1020]], w, h);
bloco = ou(bloco, baseCarne);
// remove manchas de fumaça abaixo da carne (só deixa o queijo escorrendo, que é bem claro)
for (let y = 1040; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x;
  if (bloco[p] && !baseCarne[p]) {
    const i = p * 3; const r = exp.data[i], g = exp.data[i + 1], b = exp.data[i + 2];
    const queijo = r > 170 && g > 90 && b < 90; // laranja do cheddar
    if (!queijo) bloco[p] = 0;
  }
}
// buracos só são preenchidos na região das carnes (y>=780); acima, os vãos entre bacon e cebola ficam transparentes
{
  const cheio = preencherBuracos(bloco, w, h);
  const fechado = erodir(dilatar(bloco, w, h, 4), w, h, 4); // fecha só rachaduras pequenas
  bloco = bloco.map((v, p) => (((p / w) | 0) >= 780 ? cheio[p] : fechado[p] || v));
}
bloco = manterGrandes(bloco, w, h, 4000);

/* ---------- 2) pão de baixo (contorno desenhado, a base escura some no limiar) ---------- */
const paoBaixo = ou(
  elipse(572, 1190, 366, 50, w, h),
  poligono([[207, 1190], [205, 1232], [222, 1272], [262, 1298], [350, 1314], [500, 1322], [650, 1322], [780, 1318], [860, 1308], [920, 1282], [938, 1240], [939, 1190]], w, h),
);

/* ---------- 3) topo do pão (foto montada): domo visto de fora ---------- */
const domoPts = [[112, 640], [118, 590], [133, 545], [155, 500], [185, 462], [225, 425], [260, 395], [300, 365], [350, 335], [410, 303], [470, 282], [535, 268], [595, 262], [650, 263], [710, 272], [770, 288], [825, 310], [875, 340], [920, 372], [955, 405], [985, 445], [1003, 490], [1005, 530], [996, 575], [980, 640]];
const wm = mon.w, hm = mon.h;
const P0 = poligono(domoPts, wm, hm);
const P1 = dilatar(P0, wm, hm, 9);
let domo = P0.slice();
for (let y = 0; y < hm; y++) for (let x = 380; x < wm; x++) {
  const p = y * wm + x;
  if (!P0[p] && P1[p] && lum(mon, x, y) > 85) domo[p] = 1;
}
domo = erodir(domo, wm, hm, 1);
domo = manterGrandes(domo, wm, hm, 8000);
domo = preencherBuracos(domo, wm, hm);

/* ---------- camadas ---------- */
const DESLOC = 140; // quanto o bloco desce ao montar (fecha o vão entre a carne e o pão de baixo)
const camadas = [];

function alfa(m, W, H, fn) { // fn(x,y) -> multiplicador 0..1
  const a = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (m[p]) a[p] = Math.round(255 * clamp(fn ? fn(x, y) : 1, 0, 1)); }
  return a;
}
const rampa = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

async function salvar(nome, img, a, W, H, finalXY) {
  // caixa justa ao redor do que não é transparente
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[y * W + x] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const caixa = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const s = await recortar(img, a, caixa, 1.0);
  const buf = await s.webp({ quality: 90, alphaQuality: 95, effort: 5 }).toBuffer();
  await sharp(buf).toFile(SAIDA + nome + ".webp");
  const lay = { nome, arquivo: `/img/burger/${nome}.webp`, w: caixa.width, h: caixa.height, ...finalXY(caixa) };
  camadas.push(lay);
  return buf;
}

// pão de baixo
await salvar("pao-baixo", exp, alfa(paoBaixo, w, h), w, h, (c) => ({ x: c.left, y: c.top }));

// carne de baixo + cheddar: aparece a partir de y≈850, opaca a partir de 870
const cE = alfa(bloco, w, h, (x, y) => (y >= 850 && x > 172 && x < 984 ? rampa(y, 850, 872) : 0));
await salvar("carne-baixo", exp, cE, w, h, (c) => ({ x: c.left, y: c.top + DESLOC }));

// carne de cima + cheddar: some entre 880 e 905 (a de baixo continua por baixo)
// nos primeiros pixels só entra o que é claro (queijo): a sombra escura entre o bacon e o queijo fica de fora
const cD = alfa(bloco, w, h, (x, y) => (y >= 692 && y < 910 && x > 172 && x < 984 ? rampa(y, 692, 708) * (1 - rampa(y, 880, 906)) * (y < 735 ? rampa(lum(exp, x, y), 70, 115) : 1) : 0));
await salvar("carne-cima", exp, cD, w, h, (c) => ({ x: c.left, y: c.top + DESLOC }));

// bacon + cebola: tudo acima da carne; abaixo de y=700 só o que está fora da carne (bacon pendurado, gota)
const cT = alfa(bloco, w, h, (x, y) => (y < 708 ? 1 : y < 720 && x > 178 && x < 982 ? 1 - rampa(y, 708, 720) : y < 830 && (x <= 178 || x >= 982) ? 1 : 0));
await salvar("bacon-cebola", exp, cT, w, h, (c) => ({ x: c.left, y: c.top + DESLOC }));

// topo do pão (domo) com a base se dissolvendo na cebola
const ESC = 0.855, BASE_Y = 520;
const cA = alfa(domo, wm, hm, (x, y) => 1 - rampa(y, 500, 566));
await salvar("pao-cima", mon, cA, wm, hm, (c) => ({ x: Math.round(570 + (c.left - 557) * ESC), y: Math.round(BASE_Y + (c.top - 540) * ESC) }));
// o domo foi reduzido por ESC: grava o tamanho final
const dm = camadas.find((c) => c.nome === "pao-cima");
dm.w = Math.round(dm.w * ESC);
dm.h = Math.round(dm.h * ESC);

/* ---------- layout ---------- */
const xs = camadas.map((c) => c.x), ys = camadas.map((c) => c.y);
const x0 = Math.min(...xs), y0 = Math.min(...ys);
const x1 = Math.max(...camadas.map((c) => c.x + c.w)), y1 = Math.max(...camadas.map((c) => c.y + c.h));
const layout = { largura: x1 - x0, altura: y1 - y0, camadas: camadas.map((c) => ({ ...c, x: c.x - x0, y: c.y - y0 })) };
writeFileSync("lib/burger-layout.json", JSON.stringify(layout, null, 2));
console.log(JSON.stringify(layout, null, 1));

/* ---------- imagem do hambúrguer já montado (plano B sem WebGL) ---------- */
{
  const ordem = ["pao-baixo", "carne-baixo", "carne-cima", "bacon-cebola", "pao-cima"];
  const comps = [];
  for (const n of ordem) {
    const c = layout.camadas.find((l) => l.nome === n);
    comps.push({ input: await sharp(SAIDA + n + ".webp").resize(c.w, c.h).png().toBuffer(), left: c.x, top: c.y });
  }
  await sharp({ create: { width: layout.largura, height: layout.altura, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps)
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(SAIDA + "montado.webp");
}

/* ---------- prévia da pilha montada (só para conferir) ---------- */
if (PREVIA) {
  const ordem = ["pao-baixo", "carne-baixo", "carne-cima", "bacon-cebola", "pao-cima"];
  const comps = [];
  for (const n of ordem) {
    const c = layout.camadas.find((l) => l.nome === n);
    const input = await sharp(SAIDA + n + ".webp").resize(c.w, c.h).png().toBuffer();
    comps.push({ input, left: c.x + 40, top: c.y + 40 });
  }
  await sharp({ create: { width: layout.largura + 80, height: layout.altura + 80, channels: 3, background: "#14090a" } }).composite(comps).png().toFile(PREVIA);
}
