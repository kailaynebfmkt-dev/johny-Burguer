import Hero from "@/components/Hero";
import { Cardapio, Combo, Contato, Galeria, Rodape, Sobre } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <Cardapio />
      <Combo />
      <Sobre />
      <Galeria />
      <Contato />
      <Rodape />
    </main>
  );
}
