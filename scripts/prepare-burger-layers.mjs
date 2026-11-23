// Fatia a foto "Hambúrguer Smash Explodido Gourmet.png" (já recortada, com transparência) em camadas
// e grava public/img/burger/*.webp + lib/burger-layout.json.
// Uso: node scripts/prepare-burger-layers.mjs   (PREVIA=caminho.png grava uma prévia da pilha montada)
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { DL } from "./mask-lib.mjs";

const SAIDA = "public/img/burger/";
const PREVIA = process.env.PREVIA;
mkdirSync(SAIDA, { recursive: true });

const { data, info } = await sharp(DL + "Hambúrguer Smash Explodido Gourmet.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rampa = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

/* Regra de emenda entre camadas que se encostam: a de baixo fica opaca na sobreposição e a de cima some aos poucos.
   Como as duas cópias têm os mesmos pixels da foto, a pilha montada fica idêntica à foto original. */
const REGRAS = {
  // pão de cima com a maionese: tudo até y=445, depois some até 495 (a cebola fica por baixo)
  "pao-cima": (x, y) => 1 - rampa(y, 445, 495),
  // cebola: entra entre 400 e 440 (escondida sob a maionese), sai entre 665 e 700 (o bacon fica por baixo)
  cebola: (x, y) => rampa(y, 400, 440) * (1 - rampa(y, 665, 700)),
  // bacon: entra entre 625 e 650; abaixo de 835 só as pontas que pendem para fora do queijo
  bacon: (x, y) => (y < 835 ? rampa(y, 625, 650) : x < 232 || x > 885 ? (y < 935 ? 1 : 0) : 0),
  // carne de cima + cheddar: começa no topo do queijo, sem as pontas de bacon, e some entre 1030 e 1062
  "carne-cima": (x, y) => (y < 818 ? 0 : y < 925 && (x < 232 || x > 885) ? 0 : rampa(y, 818, 826) * (1 - rampa(y, 1030, 1062))),
  // carne de baixo + cheddar: entra entre 1000 e 1022 (escondida sob a de cima), vai até a gota de queijo (1262)
  "carne-baixo": (x, y) => (y < 1000 ? 0 : y > 1266 ? 0 : rampa(y, 1000, 1022)),
  // pão de baixo: é uma peça isolada (y >= 1262)
  "pao-baixo": (x, y) => (y >= 1262 ? 1 : 0),
};

// ordem de baixo para cima e deslocamento (em px da foto) ao fechar os vãos na montagem
const DESCE = 0; // 0 = camadas separadas, como na foto (valores positivos fecham os vãos)
const ORDEM = [
  ["pao-baixo", 0],
  ["carne-baixo", DESCE],
  ["carne-cima", DESCE],
  ["bacon", DESCE],
  ["cebola", DESCE],
  ["pao-cima", DESCE],
];

const camadas = [];
const bufs = {};
for (const [nome, desce] of ORDEM) {
  const f = REGRAS[nome];
  const rgba = Buffer.alloc(W * H * 4);
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const a = Math.round(data[p * 4 + 3] * f(x, y));
      if (a <= 0) continue;
      rgba[p * 4] = data[p * 4]; rgba[p * 4 + 1] = data[p * 4 + 1]; rgba[p * 4 + 2] = data[p * 4 + 2]; rgba[p * 4 + 3] = a;
      if (a > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
  const caixa = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const buf = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract(caixa).webp({ quality: 90, alphaQuality: 95, effort: 5 }).toBuffer();
  bufs[nome] = buf;
  await sharp(buf).toFile(SAIDA + nome + ".webp");
  camadas.push({ nome, arquivo: `/img/burger/${nome}.webp`, w: caixa.width, h: caixa.height, x: x0, y: y0 + desce });
}

/* layout: coordenadas relativas ao retângulo que envolve a pilha montada */
const xs0 = Math.min(...camadas.map((c) => c.x)), ys0 = Math.min(...camadas.map((c) => c.y));
const xs1 = Math.max(...camadas.map((c) => c.x + c.w)), ys1 = Math.max(...camadas.map((c) => c.y + c.h));
const layout = { largura: xs1 - xs0, altura: ys1 - ys0, camadas: camadas.map((c) => ({ ...c, x: c.x - xs0, y: c.y - ys0 })) };
writeFileSync("lib/burger-layout.json", JSON.stringify(layout, null, 2));
console.log(JSON.stringify({ largura: layout.largura, altura: layout.altura, camadas: layout.camadas.map((c) => [c.nome, c.x, c.y, c.w, c.h]) }));

/* imagem do hambúrguer montado (plano B sem WebGL) e prévia opcional */
const comps = [];
for (const c of layout.camadas) comps.push({ input: await sharp(bufs[c.nome]).png().toBuffer(), left: c.x, top: c.y });
const montado = await sharp({ create: { width: layout.largura, height: layout.altura, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png().toBuffer();
await sharp(montado).webp({ quality: 90, alphaQuality: 95 }).toFile(SAIDA + "montado.webp");
if (PREVIA) {
  const fundo = await sharp({ create: { width: layout.largura + 60, height: layout.altura + 60, channels: 3, background: "#14090a" } }).composite([{ input: montado, left: 30, top: 30 }]).png().toBuffer();
  await sharp(fundo).png().toFile(PREVIA);
}
