import CheckoutView from "@/components/checkout/checkout-view";
import { PUPUSAS } from "@/lib/checkout";

export default function Home() {
  return <CheckoutView pupusas={PUPUSAS} />;
}
