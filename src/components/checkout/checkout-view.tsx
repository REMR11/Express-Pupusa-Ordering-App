"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

import {
  CURTIDO_OPTIONS,
  MASA_OPTIONS,
  SALSA_OPTIONS,
  SLOT_FALLBACK,
  buildSlots,
  computeTotals,
  initialQty,
  slotLabel,
  validateOrder,
  type Curtido,
  type Masa,
  type OrderErrors,
  type Pupusa,
  type Salsa,
  type Slot,
} from "@/lib/checkout";

import { CartBar } from "./cart-bar";
import { ConfirmationModal } from "./confirmation-modal";
import { CustomerForm } from "./customer-form";
import { PupusaCard } from "./pupusa-card";
import { RadioGroup } from "./radio-group";
import { ComalBanner, GuaranteeNote, Header } from "./static-sections";
import { Icon, SectionCard, SectionHeading } from "./ui";

const LABEL_PILL =
  "font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed";

const subscribe = () => () => {};
let clientSlots: ReturnType<typeof buildSlots> | null = null;
const getSlots = () => (clientSlots ??= buildSlots(new Date()));
const getServerSlots = () => SLOT_FALLBACK;

export default function CheckoutView({ pupusas }: { pupusas: Pupusa[] }) {
  const [qty, setQty] = useState(() => initialQty(pupusas));
  const [masa, setMasa] = useState<Masa>("maiz");
  const [curtido, setCurtido] = useState<Curtido>("normal");
  const [salsa, setSalsa] = useState<Salsa>("bote");
  const [slot, setSlot] = useState<Slot>("15");
  const [customTime, setCustomTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<OrderErrors>({});
  const [confirmed, setConfirmed] = useState(false);
  const slotOptions = useSyncExternalStore(subscribe, getSlots, getServerSlots);
  const { count, totalCents } = computeTotals(qty, pupusas);
  const firstName = name.trim().split(" ")[0] || "";

  const clearError = (field: keyof OrderErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const updateQty = (key: string, delta: number) => {
    setQty((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
    clearError("count");
  };

  const confirmOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateOrder({ qty, name, phone, slot, customTime }, pupusas);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.name) document.getElementById("input-customer-name")?.focus();
      else if (nextErrors.phone) document.getElementById("input-customer-phone")?.focus();
      else if (nextErrors.customTime) document.getElementById("input-custom-time")?.focus();
      return;
    }

    setErrors({});
    setConfirmed(true);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased flex flex-col min-h-screen">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        href="#main"
      >
        Saltar al contenido
      </a>
      <Header />

      <main
        className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin"
        id="main"
        tabIndex={-1}
      >
        <div className="flex flex-col w-full max-w-lg mx-auto gap-space-md pb-36">
          <ComalBanner />

          <SectionCard>
            <SectionHeading
              aside={<span className={LABEL_PILL}>Global</span>}
              icon="bakery_dining"
              spacing="sm"
              title="Tipo de Masa Predilecta"
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Aplica a todas tus pupusas por defecto. ¡Pruébalas recién palmeadas!
            </p>
            <RadioGroup
              legend="Tipo de masa"
              name="masa"
              onChange={(value) => setMasa(value)}
              options={MASA_OPTIONS}
              tone="secondary"
              value={masa}
            />
          </SectionCard>

          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="restaurant_menu" className="text-[20px] text-primary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Pupusas Recién Salidas
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Hechas al momento
              </span>
            </div>
            <div className="flex flex-col gap-space-sm">
              {pupusas.map((pupusa) => (
                <PupusaCard
                  key={pupusa.key}
                  onDecrease={() => updateQty(pupusa.key, -1)}
                  onIncrease={() => updateQty(pupusa.key, 1)}
                  pupusa={pupusa}
                  qty={qty[pupusa.key] ?? 0}
                />
              ))}
            </div>
          </div>

          <SectionCard>
            <SectionHeading
              aside={<span className={LABEL_PILL}>¡Gratis con tu pedido!</span>}
              icon="eco"
              title="Acompañamientos Tradicionales"
              tone="secondary"
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Personaliza cómo deseas recibir tu curtido y salsa casera de tomate:
            </p>
            <div className="grid grid-cols-1 gap-space-sm">
              <div className="flex items-center justify-between gap-space-sm p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-space-sm">
                  <Icon name="nutrition" className="text-[22px] text-primary" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-on-surface">
                      Curtido Artesanal con Orégano
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Fermentado en vinagre de piña natural
                    </span>
                  </div>
                </div>
                <RadioGroup
                  legend="Curtido"
                  name="curtido"
                  onChange={(value) => setCurtido(value)}
                  options={CURTIDO_OPTIONS}
                  value={curtido}
                  variant="pill"
                />
              </div>
              <div className="flex items-center justify-between gap-space-sm p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-space-sm">
                  <Icon name="soup_kitchen" className="text-[22px] text-primary" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-on-surface">
                      Salsa Caliente de Tomate Criollo
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Sazonada con orégano y laurel
                    </span>
                  </div>
                </div>
                <RadioGroup
                  legend="Salsa"
                  name="salsa"
                  onChange={(value) => setSalsa(value)}
                  options={SALSA_OPTIONS}
                  value={salsa}
                  variant="pill"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeading
              aside={
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  Sin fila en mostrador
                </span>
              }
              icon="timer"
              title="Horario de Retiro Express"
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Selecciona la hora estimada en la que pasarás por tu comal:
            </p>
            <RadioGroup
              legend="Horario de retiro"
              name="slot"
              onChange={(value) => {
                setSlot(value);
                clearError("customTime");
              }}
              options={slotOptions}
              value={slot}
            />
            {slot === "custom" && (
              <div className="mt-space-sm flex flex-col">
                <label
                  className="font-label-md text-label-md text-on-surface mb-1"
                  htmlFor="input-custom-time"
                >
                  Hora de retiro
                </label>
                <input
                  aria-describedby={errors.customTime ? "error-custom-time" : undefined}
                  aria-invalid={Boolean(errors.customTime)}
                  className="w-full rounded-lg bg-surface-container px-3 py-2.5 font-body-md text-on-surface focus:bg-surface-container-lowest focus:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error"
                  id="input-custom-time"
                  onChange={(event) => {
                    setCustomTime(event.target.value);
                    clearError("customTime");
                  }}
                  type="time"
                  value={customTime}
                />
                {errors.customTime && (
                  <p
                    className="mt-1 font-label-sm text-label-sm text-error"
                    id="error-custom-time"
                  >
                    {errors.customTime}
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          <CustomerForm
            errors={errors}
            name={name}
            notes={notes}
            onName={(value) => {
              setName(value);
              clearError("name");
            }}
            onNotes={setNotes}
            onPhone={(value) => {
              setPhone(value);
              clearError("phone");
            }}
            onSubmit={confirmOrder}
            phone={phone}
          />

          <GuaranteeNote />
        </div>
      </main>

      <CartBar count={count} error={errors.count} masa={masa} totalCents={totalCents} />

      {confirmed && (
        <ConfirmationModal
          count={count}
          firstName={firstName}
          masa={masa}
          onClose={() => setConfirmed(false)}
          phone={phone.trim()}
          slotLabel={slotLabel(slot, slotOptions, customTime)}
        />
      )}
    </div>
  );
}
