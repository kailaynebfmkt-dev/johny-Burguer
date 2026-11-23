// Todo o texto e todos os links do site ficam aqui.

export const LINK_PEDIDO = "https://johnyburguer.saipos.com/home";
export const LINK_CONTATO = "https://linktr.ee/Johny.Burguer";
export const LINK_INSTAGRAM = "https://www.instagram.com/johny.burger/";

export const SITE_URL = "https://johny-burguer.vercel.app"; // TODO: trocar pelo domínio final

export const NAV = [
  { href: "#cardapio", label: "Cardápio" },
  { href: "#combo", label: "Combo" },
  { href: "#sobre", label: "Sobre" },
  { href: "#historia", label: "Nossa história" },
  { href: "#contato", label: "Contato" },
];

export const HERO = {
  titulo: "SMASH DE VERDADE.",
  subtitulo:
    "Pão brioche, carne smash 120g e cheddar duplo derretendo. Do jeito que tem que ser.",
};

export const CARDAPIO = {
  titulo: "OS MAIS PEDIDOS",
  itens: [
    {
      nome: "BACON CARAMELIZADO", // nome tirado do arquivo da foto — confirmar com o cliente
      descricao: "A deliciosa combinação de bacon com a nossa cebola caramelizada!",
      ingredientes: [
        "Pão brioche",
        "Smash 120g",
        "Queijo cheddar duplo",
        "Bacon",
        "Cebola caramelizada",
        "Maionese",
      ],
      foto: "/img/bacon.webp",
      alt: "Hambúrguer smash com bacon e cebola caramelizada em uma cesta",
      largura: 692,
      altura: 857,
    },
    {
      nome: "SALAD BURGER CLÁSSICO",
      descricao: "Esse é o nosso Salad Burger Clássico!",
      ingredientes: [
        "Pão brioche",
        "Smash burger 120g",
        "Duplo queijo cheddar",
        "Tomate",
        "Alface",
        "Cebola roxa",
        "Maionese da casa",
      ],
      foto: "/img/salad.webp",
      alt: "Salad Burger Clássico segurado com as duas mãos",
      largura: 717,
      altura: 875,
    },
  ],
};

export const COMBO = {
  selo: "COMBO",
  titulo: "COMBO X-SALADÃO",
  itens: [
    {
      icone: "burger",
      texto:
        "2x Burgers “X-Saladão” de 120g com duplo queijo cheddar, alface, tomate e cebola roxa, com a nossa maionese dos deuses",
    },
    { icone: "batata", texto: "2x Porções de batata crinkle de 150g" },
    { icone: "refri", texto: "1x Coca-Cola 600ml bem gelada" },
  ],
  frase: "Pra dividir… ou não.",
  botao: "QUERO ESSE COMBO",
  foto: "/img/combo.webp",
  alt: "Combo X-Saladão na bandeja com dois burgers, batata crinkle e Coca-Cola",
  largura: 690,
  altura: 782,
};

export const SOBRE = {
  titulo: "POR QUE O JOHNY?",
  blocos: [
    { icone: "smash", titulo: "SMASH 120G", texto: "Prensada na chapa bem quente pra crosta perfeita." },
    { icone: "cheddar", titulo: "CHEDDAR DUPLO", texto: "Duas camadas de queijo derretendo em cada mordida." },
    { icone: "maionese", titulo: "MAIONESE DOS DEUSES", texto: "Receita da casa. Não conta pra ninguém." },
    { icone: "batata", titulo: "BATATA CRINKLE", texto: "Ondulada, sequinha e crocante." },
  ],
  marquee: ["SMASH", "CHEDDAR", "BACON", "BRIOCHE", "CRINKLE"],
};

export const HISTORIA = {
  titulo: "NOSSA HISTÓRIA",
  intro:
    "O Johny Burger em Tramandaí começou de forma simples no delivery, por volta de 2022, e cresceu até se tornar um ponto físico no Centro da cidade, com foco em smash burgers, crepes e entradas.",
  marcos: [
    {
      quando: "2022",
      titulo: "Tudo começou no delivery",
      texto:
        "A operação nasceu com poucas opções de lanches, atendendo amigos, familiares e os primeiros clientes locais, antes de abrir um espaço físico.",
    },
    {
      quando: "Todo mês",
      titulo: "O primeiro burger do mês",
      texto:
        "O Johny Honey inaugurou a linha especial mensal da casa e segue sendo resgatado como um clássico de edição limitada.",
    },
    {
      quando: "Centro",
      titulo: "Ponto na Av. Fernando Amaral",
      texto:
        "A marca marcou presença na Av. Fernando Amaral, 291, incluindo atuação vinculada ao Villa Manggiare, e firmou o nome no Centro de Tramandaí.",
    },
    {
      quando: "Julho de 2025",
      titulo: "Casa nova, no 301",
      texto:
        "A abertura da nova casa na Av. Fernando Amaral, 301, foi celebrada com música ao vivo e chopp.",
    },
    {
      quando: "Hoje",
      titulo: "Um cardápio que cresceu",
      texto:
        "Além dos smash burgers de 1 a 3 carnes, entraram porções como a batata especial e a almofadinha de queijo gouda, os crepes e opções como o JohnyFit.",
    },
  ],
};

export const GALERIA = {
  titulo: "SEGUE O JOHNY",
  botao: "@johny.burger no Instagram",
  fotos: [
    { src: "/img/bacon.webp", alt: "Burger de bacon com cheddar derretendo", w: 692, h: 857 },
    { src: "/img/galeria-salad-detalhe.webp", alt: "Detalhe do smash com alface, tomate e cebola roxa", w: 611, h: 611 },
    { src: "/img/combo.webp", alt: "Combo X-Saladão na bandeja", w: 690, h: 782 },
    { src: "/img/galeria-bacon-detalhe.webp", alt: "Detalhe das carnes smash com cheddar e bacon", w: 595, h: 595 },
    { src: "/img/salad.webp", alt: "Salad Burger Clássico nas mãos", w: 717, h: 875 },
    { src: "/img/galeria-combo-batata.webp", alt: "Batata crinkle e Coca-Cola gelada", w: 598, h: 598 },
  ],
};

export const CONTATO = {
  titulo: "BATEU A FOME?",
  pedir: "FAZER PEDIDO",
  falar: "FALE COM A GENTE",
  endereco: "Av. Fernando Amaral, 301 — Centro, Tramandaí/RS",
  mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Fernando+Amaral+301+Tramanda%C3%AD+RS",
  mapaTexto: "Ver no Google Maps",
  horario: "[INSERIR HORÁRIO]",
};

export const RODAPE = {
  direitos: "© Johny Burger — Todos os direitos reservados",
};

export const SEO = {
  titulo: "Johny Burger | Smash Burger Artesanal — Peça Online",
  descricao:
    "Smash burger artesanal com pão brioche, carne 120g e cheddar duplo derretendo. Conheça o cardápio, o Combo X-Saladão e peça online na Johny Burger.",
};
