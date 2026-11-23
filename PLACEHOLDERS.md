# Pendências do cliente — Johny Burger

- [x] **Endereço** informado pelo cliente: Av. Fernando Amaral, 301, Centro, Tramandaí/RS (`CONTATO.endereco`), confirmado pelo cliente.
- [x] **Horário de funcionamento** informado pelo cliente: todos os dias, 17:00–23:00 (`CONTATO.horario`).
- [ ] **Nome do burger de bacon** → `lib/content.ts` (`CARDAPIO.itens[0].nome`). Foi usado "BACON CARAMELIZADO", tirado do nome do arquivo da foto. Confirmar.
- [ ] **Domínio final** → `SITE_URL` em `lib/content.ts` (usado no Open Graph).
- [ ] **Fotos em alta resolução**: as fotos enviadas têm ~280px de largura; foram ampliadas 2,5x (aparecem levemente suaves). Trocar por originais maiores em `scripts/prepare-images.mjs` (`node scripts/prepare-images.mjs`).
- Depuração: `?t=3.2` na URL congela a montagem no segundo indicado.
- [ ] **Texto da história**: o texto enviado terminava cortado ("em parceria com o nutricionista…"). A frase foi encurtada em `HISTORIA` (`lib/content.ts`); completar se quiserem citar o parceiro do JohnyFit.
- [ ] **Instagram**: o link do site usa `johny.burger`, mas a busca achou o perfil `johny.burguer`. Confirmar qual é o correto.
- [ ] **Nome do burger**: o título do hero agora é "JOHNY MELT" (pedido do cliente). A foto de referência (duplo smash, cheddar, bacon, cebola caramelizada e maionese) parece ser esse mesmo burger; confirmar se o card "BACON CARAMELIZADO" do cardápio deve virar "JOHNY MELT".
- [ ] **Burger do hero**: é montado com camadas recortadas das 2 fotos de referência do cliente (explodido + montado). Arrastar inclina o burger (não gira 360°, porque são fotos). Para trocar a foto, rode `node scripts/prepare-burger-layers.mjs`; se a nova foto tiver outras posições, ajuste os recortes no script.
