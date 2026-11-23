# Pendências do cliente — Johny Burger

- [ ] **Endereço** → `lib/content.ts` (`CONTATO.endereco`, hoje `[INSERIR ENDEREÇO]`)
- [ ] **Horário de funcionamento** → `lib/content.ts` (`CONTATO.horario`, hoje `[INSERIR HORÁRIO]`)
- [ ] **Nome do burger de bacon** → `lib/content.ts` (`CARDAPIO.itens[0].nome`). Foi usado "BACON CARAMELIZADO", tirado do nome do arquivo da foto. Confirmar.
- [ ] **Domínio final** → `SITE_URL` em `lib/content.ts` (usado no Open Graph).
- [ ] **Fotos em alta resolução**: as fotos enviadas têm ~280px de largura; foram ampliadas 2,5x (aparecem levemente suaves). Trocar por originais maiores em `scripts/prepare-images.mjs` (`node scripts/prepare-images.mjs`).
- Depuração: `?t=3.2` na URL congela a montagem 3D no segundo indicado.
