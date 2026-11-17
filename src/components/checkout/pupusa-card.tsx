import Image from "next/image";

import { BADGE_TONES, money, type Pupusa } from "@/lib/checkout";

import { Icon } from "./ui";

export function PupusaCard({
  pupusa,
  qty,
  onDecrease,
  onIncrease,
}: {
  pupusa: Pupusa;
  qty: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl p-space-md shadow-sm transition ${
        qty > 0 ? "bg-surface-container-low" : "bg-surface-container-lowest"
      }`}
    >
      <div className="flex gap-space-sm">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
          <Image
            alt={pupusa.name}
            className="h-full w-full object-cover"
            height={80}
            src={pupusa.img}
            width={80}
          />
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                {pupusa.name}
              </span>
              {pupusa.badge && (
                <span
                  className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${BADGE_TONES[pupusa.badge.tone]}`}
                >
                  {pupusa.badge.icon && (
                    <Icon name={pupusa.badge.icon} className="text-[11px]" filled />
                  )}
                  {pupusa.badge.label}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
              {pupusa.desc}
            </p>
          </div>
          <div className="flex items-center justify-between mt-space-xs">
            <span className="font-headline-sm text-headline-sm text-primary">
              {money(pupusa.priceCents)}
            </span>
            <div className="flex items-center bg-surface-container rounded-full p-1 gap-2 shadow-sm">
              <button
                aria-label={`Disminuir ${pupusa.name}`}
                className="w-7 h-7 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={onDecrease}
                type="button"
              >
                <Icon name="remove" className="text-[16px]" />
              </button>
              <span className="font-label-lg text-label-lg text-on-surface w-4 text-center tabular-nums">
                {qty}
              </span>
              <button
                aria-label={`Aumentar ${pupusa.name}`}
                className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={onIncrease}
                type="button"
              >
                <Icon name="add" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
