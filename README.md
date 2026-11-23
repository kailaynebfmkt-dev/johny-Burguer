# Johny Burger — site one-page

Next.js + React Three Fiber. Hero com o hambúrguer (camadas recortadas das fotos do cliente) que se monta sozinho ao abrir, com queda, quique e etiquetas; nenhuma animação depende de rolagem.

- `npm run dev` / `npm run build` / `npm start`
- Textos e links: `lib/content.ts`
- Pendências do cliente: `PLACEHOLDERS.md`
- Imagens do cardápio: `node scripts/prepare-images.mjs`
- Camadas do hambúrguer do hero: `node scripts/prepare-burger-layers.mjs` (lê as fotos "Hambúrguer Explodido…" e "Hambúrguer Triplo…" da pasta Downloads e grava `public/img/burger/*.webp` + `lib/burger-layout.json`)
