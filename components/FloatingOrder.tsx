import { LINK_PEDIDO } from "@/lib/content";
import { IconeSacola } from "./Icons";

export default function FloatingOrder() {
  return (
    <a className="flutuante" href={LINK_PEDIDO} target="_blank" rel="noopener noreferrer" aria-label="Fazer pedido">
      <IconeSacola />
      PEDIR
    </a>
  );
}
