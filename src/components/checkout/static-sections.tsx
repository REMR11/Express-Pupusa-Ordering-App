import Image from "next/image";
import { useRouter } from "next/navigation";

import { Icon } from "./ui";

export function Header() {
  const router = useRouter();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-gutter flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <button
            aria-label="Volver"
            className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() =>
              window.history.length > 1 ? window.history.back() : router.push("/")
            }
            type="button"
          >
            <Icon name="arrow_back" className="text-[24px]" />
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface">Fast Checkout</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Icon name="person" className="text-[18px] text-on-primary" />
        </div>
      </div>
    </header>
  );
}

export function ComalBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-sm">
      <div className="flex items-center justify-between gap-space-sm relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-primary mb-1">
            <Icon name="local_fire_department" className="text-[18px]" filled />
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary">
              Comal Encendido • Retiro Express
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface">
            Pide directo sin cuenta
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Te avisamos por WhatsApp cuando estén bien doraditas.
          </p>
        </div>
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container shadow-sm">
          <Image
            alt="Pupusas salvadoreñas dorándose en un comal caliente"
            className="h-full w-full object-cover"
            height={64}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDweERHQO4O7x0GIJjbMrm6rpk-Ogkjz5AqBgVlCWoZpuyqGAcC69HcAXOjWy2y595mDbIBC3fG4R4ZjS-GtvbWJc5UXFjfuXl-Ept_Lb0jKD6wV2VUVzpC3xDuesFfBiPK32bW6rlTAPMleYjNto4shJ19ZRGJr22puaYExpNGBxYtJtbtdp8itcEFNGgg-6XxZ96NaL911IQEXtYgMBGj7up1wEYikjQrXlT2O-o"
            width={64}
          />
        </div>
      </div>
    </div>
  );
}

export function GuaranteeNote() {
  return (
    <div className="flex items-center gap-space-sm p-3 rounded-xl bg-surface-container-high">
      <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed">
        <Icon name="verified" className="text-[20px]" filled />
      </div>
      <div className="flex flex-col">
        <span className="font-label-md text-label-md text-on-surface font-bold">
          Garantía Comal Caliente
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Si tu pupusa no está humeando al retirarla, ¡te la preparamos de nuevo al instante!
        </p>
      </div>
    </div>
  );
}
