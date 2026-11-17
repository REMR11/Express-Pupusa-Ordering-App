import { useEffect, useEffectEvent, useRef } from "react";

import { MASA_LABELS, type Masa } from "@/lib/checkout";

import { Icon } from "./ui";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmationModal({
  firstName,
  count,
  masa,
  phone,
  slotLabel,
  onClose,
}: {
  firstName: string;
  count: number;
  masa: Masa;
  phone: string;
  slotLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = dialogRef.current.contains(active);
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      aria-describedby="confirm-detail"
      aria-labelledby="confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-inverse-surface/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overscroll-contain"
      role="dialog"
    >
      <div
        className="bg-surface-container-lowest w-full max-w-md rounded-xl p-space-lg shadow-xl flex flex-col items-center text-center"
        ref={dialogRef}
      >
        <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-space-sm shadow-sm motion-safe:animate-bounce">
          <Icon name="check" className="text-[32px]" filled />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-1" id="confirm-title">
          ¡Comal en Marcha!
        </h3>
        <p
          className="font-body-md text-body-md text-on-surface-variant mb-space-md"
          id="confirm-detail"
        >
          {`¡Listo ${firstName}! Tus ${count} pupusas en masa de ${MASA_LABELS[masa]} están en el comal. Avisaremos al ${phone}.`}
        </p>
        <div className="w-full bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 mb-space-md text-left">
          <div className="flex justify-between font-label-md text-label-md text-on-surface">
            <span>Tiempo estimado de entrega:</span>
            <span className="text-primary font-bold">{slotLabel}</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md text-on-surface">
            <span>Forma de pago:</span>
            <span className="text-secondary font-bold">Efectivo o Transferencia al recoger</span>
          </div>
        </div>
        <button
          className="w-full h-12 rounded-full bg-surface-container text-on-surface font-label-lg text-label-lg active:scale-95 transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          Entendido, voy en camino
        </button>
      </div>
    </div>
  );
}
