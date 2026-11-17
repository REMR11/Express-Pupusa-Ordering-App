import type { FormEvent } from "react";

import type { OrderErrors } from "@/lib/checkout";

import { Icon, SectionCard, SectionHeading } from "./ui";

const INPUT_CLASS =
  "w-full rounded-lg bg-surface-container text-on-surface font-body-md placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error";

export function CustomerForm({
  name,
  phone,
  notes,
  errors,
  onName,
  onPhone,
  onNotes,
  onSubmit,
}: {
  name: string;
  phone: string;
  notes: string;
  errors: OrderErrors;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
  onNotes: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id="checkout-form" noValidate onSubmit={onSubmit}>
      <SectionCard>
        <SectionHeading icon="badge" title="Datos para Llamarte al Comal" />
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
          Sin registros pesados. Solo tu nombre y WhatsApp para entregártelas recién hechas.
        </p>
        <div className="flex flex-col gap-space-sm">
          <div className="flex flex-col">
            <label
              className="font-label-md text-label-md text-on-surface mb-1 flex items-center gap-1"
              htmlFor="input-customer-name"
            >
              <span>Nombre para el retiro</span>
              <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <Icon
                name="person_pin"
                className="absolute left-3 text-[20px] text-tertiary pointer-events-none"
              />
              <input
                aria-describedby={errors.name ? "error-customer-name" : undefined}
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                className={`${INPUT_CLASS} pl-10 pr-3 py-3`}
                id="input-customer-name"
                name="name"
                onChange={(e) => onName(e.target.value)}
                placeholder="Ej. Carlos Hernández"
                spellCheck={false}
                type="text"
                value={name}
              />
            </div>
            {errors.name && (
              <p className="mt-1 font-label-sm text-label-sm text-error" id="error-customer-name">
                {errors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label
              className="font-label-md text-label-md text-on-surface mb-1 flex items-center justify-between"
              htmlFor="input-customer-phone"
            >
              <span className="flex items-center gap-1">
                <span>WhatsApp para notificación</span>
                <span className="text-error">*</span>
              </span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5">
                <Icon name="chat" className="text-[12px]" />
                Te avisamos al salir
              </span>
            </label>
            <div className="relative flex items-center">
              <Icon
                name="call"
                className="absolute left-3 text-[20px] text-tertiary pointer-events-none"
              />
              <input
                aria-describedby={errors.phone ? "error-customer-phone" : undefined}
                aria-invalid={Boolean(errors.phone)}
                autoComplete="tel"
                className={`${INPUT_CLASS} pl-10 pr-3 py-3`}
                id="input-customer-phone"
                inputMode="tel"
                maxLength={12}
                name="phone"
                onChange={(e) => onPhone(e.target.value)}
                placeholder="Ej. 7890-1234"
                spellCheck={false}
                type="tel"
                value={phone}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 font-label-sm text-label-sm text-error" id="error-customer-phone">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label
              className="font-label-md text-label-md text-on-surface mb-1 flex items-center justify-between"
              htmlFor="input-order-notes"
            >
              <span>{"Instrucciones pal' comal (opcional)"}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Ej. bien tostadas
              </span>
            </label>
            <input
              autoComplete="off"
              className={`${INPUT_CLASS} px-3 py-2.5 font-body-sm`}
              id="input-order-notes"
              name="notes"
              onChange={(e) => onNotes(e.target.value)}
              placeholder="Ej. Una revuelta bien tostada con queso quemadito"
              type="text"
              value={notes}
            />
          </div>
        </div>
      </SectionCard>
    </form>
  );
}
