import { MASA_LABELS, money, type Masa } from "@/lib/checkout";

import { Icon } from "./ui";

export function CartBar({
  count,
  totalCents,
  masa,
  error,
}: {
  count: number;
  totalCents: number;
  masa: Masa;
  error?: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-surface/95 backdrop-blur-md px-margin py-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col max-w-lg mx-auto w-full gap-2">
        {error && (
          <p className="font-label-sm text-label-sm text-error px-1" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-label-md text-label-md text-on-surface">
              <span>{count}</span> Pupusas
            </span>
            <span className="text-tertiary">•</span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
              {MASA_LABELS[masa]}
            </span>
            <span className="text-tertiary">•</span>
            <span className="text-secondary text-label-sm">Curtido &amp; Salsa Inc.</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Subtotal:</span>
            <span className="font-label-md text-label-md text-on-surface">{money(totalCents)}</span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex flex-col pl-1 flex-shrink-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Total a Pagar
            </span>
            <span className="font-headline-lg text-headline-lg text-primary leading-none tabular-nums">
              {money(totalCents)}
            </span>
          </div>
          <button
            className="flex-1 h-14 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            form="checkout-form"
            type="submit"
          >
            <Icon name="shopping_bag" className="text-[20px]" />
            <span>Pagar al Retirar</span>
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
