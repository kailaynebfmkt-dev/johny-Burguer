import Hero from "@/components/Hero";
import { Cardapio, Combo, Contato, Galeria, Historia, Rodape, Sobre } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <Cardapio />
      <Combo />
      <Sobre />
      <Historia />
      <Galeria />
      <Contato />
      <Rodape />
    </main>
  );
}
