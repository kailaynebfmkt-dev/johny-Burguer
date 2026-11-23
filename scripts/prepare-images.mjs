// Gera os assets otimizados (WebP, logo transparente, OG, ícone) a partir das fotos originais.
// Uso: node scripts/prepare-images.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const DL = "C:/Users/Pichau/Downloads/";
const OUT = "public/img/";
mkdirSync(OUT, { recursive: true });

const fotos = {
  bacon: "johny-burger-bacon-caramelizado.jpg",
  salad: "johny-salad-burger-classico.jpg",
  combo: "johny-combo-x-saladao.jpg",
};

// Fotos originais são pequenas (~280px): amplia 2.5x com Lanczos + leve nitidez.
async function ampliar(src, dest, { extract, escala = 2.5, q = 80 } = {}) {
  let img = sharp(DL + src);
  if (extract) img = img.extract(extract);
  const buf = await img.toBuffer();
  const m = await sharp(buf).metadata();
  await sharp(buf)
    .resize(Math.round(m.width * escala), null, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: q })
    .toFile(OUT + dest);
  console.log("ok", dest);
}

for (const [k, f] of Object.entries(fotos)) await ampliar(f, `${k}.webp`);

// Recortes para a galeria
await ampliar(fotos.bacon, "galeria-bacon-detalhe.webp", { extract: { left: 55, top: 85, width: 170, height: 170 }, escala: 3.5 });
await ampliar(fotos.salad, "galeria-salad-detalhe.webp", { extract: { left: 25, top: 105, width: 235, height: 235 }, escala: 2.6 });
await ampliar(fotos.combo, "galeria-combo-batata.webp", { extract: { left: 0, top: 0, width: 230, height: 230 }, escala: 2.6 });

// Logo: fundo preto -> transparente (luminância vira alfa), recortado e ampliado
const logoSrc = DL + "images (1).png";
const recorte = await sharp(logoSrc).trim({ threshold: 40 }).toBuffer();
const rm = await sharp(recorte).metadata();
const W = rm.width * 3;
const H = rm.height * 3;
const gray = await sharp(recorte)
  .greyscale()
  .resize(W, H, { kernel: "lanczos3" })
  .raw()
  .toBuffer();
const branco = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .raw()
  .toBuffer();
// canal alfa = luminância (realça um pouco o contraste)
const alfa = Buffer.from(gray.map((v) => Math.min(255, Math.max(0, (v - 20) * 1.15))));
const logoPng = await sharp(branco, { raw: { width: W, height: H, channels: 3 } })
  .joinChannel(alfa, { raw: { width: W, height: H, channels: 1 } })
  .png()
  .toBuffer();
await sharp(logoPng).png({ compressionLevel: 9 }).toFile("public/logo.png");
await sharp(logoPng).webp({ quality: 90, alphaQuality: 95 }).toFile("public/logo.webp");
console.log("logo", W, H);

// Ícone (favicon): logo original quadrada
await sharp(logoSrc).resize(512, 512, { kernel: "lanczos3" }).png().toFile("app/icon.png");

// Open Graph 1200x630: fundo escuro quente + foto do hambúrguer + logo
const fotoH = 630;
const fotoBacon = await sharp(DL + fotos.bacon)
  .resize({ height: fotoH, kernel: "lanczos3" })
  .sharpen({ sigma: 0.8 })
  .toBuffer();
const fm = await sharp(fotoBacon).metadata();
const fundo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="g" cx="75%" cy="55%" r="65%">
      <stop offset="0" stop-color="#5A2E1A"/><stop offset="0.55" stop-color="#1a0f0a"/><stop offset="1" stop-color="#0B0B0B"/>
    </radialGradient>
    <linearGradient id="f" x1="0" x2="1">
      <stop offset="0" stop-color="#0B0B0B" stop-opacity="1"/><stop offset="1" stop-color="#0B0B0B" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
</svg>`);
const logoOg = await sharp(logoPng).resize({ width: 460 }).toBuffer();
const lm = await sharp(logoOg).metadata();
const degrade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fm.width}" height="630">
  <defs><linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="#0B0B0B"/><stop offset="0.45" stop-color="#0B0B0B" stop-opacity="0"/></linearGradient></defs>
  <rect width="${fm.width}" height="630" fill="url(#f)"/></svg>`);
const barra = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="460" height="8"><rect width="150" height="8" rx="4" fill="#F5A623"/></svg>`);
await sharp(fundo)
  .composite([
    { input: fotoBacon, left: 1200 - fm.width, top: 0 },
    { input: degrade, left: 1200 - fm.width, top: 0 },
    { input: logoOg, left: 90, top: Math.round((630 - lm.height) / 2) - 20 },
    { input: barra, left: 90, top: Math.round((630 - lm.height) / 2) + lm.height + 10 },
  ])
  .png({ compressionLevel: 9 })
  .toFile("public/og.png");
console.log("og ok");
