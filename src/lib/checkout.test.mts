import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PUPUSAS,
  buildSlots,
  computeTotals,
  formatClock,
  initialQty,
  money,
  slotLabel,
  validateOrder,
} from "./checkout.ts";

test("initialQty deriva todas las claves de PUPUSAS", () => {
  const qty = initialQty();
  assert.deepEqual(Object.keys(qty).sort(), PUPUSAS.map((p) => p.key).sort());
  assert.equal(qty.revueltas, 2);
  assert.equal(qty.loroco, 1);
  assert.equal(qty.especial, 0);
});

test("computeTotals suma cantidades y centavos sin floats", () => {
  assert.deepEqual(computeTotals({}), { count: 0, totalCents: 0 });
  assert.deepEqual(computeTotals({ revueltas: 2, loroco: 1 }), {
    count: 3,
    totalCents: 135 * 2 + 150,
  });
  assert.deepEqual(computeTotals({ desconocida: 5 }), { count: 0, totalCents: 0 });
});

test("money formatea centavos como USD", () => {
  assert.equal(money(135), "$1.35");
  assert.equal(money(0), "$0.00");
});

test("buildSlots calcula horas relativas y marca la recomendada", () => {
  const slots = buildSlots(new Date("2026-01-01T18:15:00Z"));
  assert.equal(slots.length, 4);
  assert.equal(slots[0].sub, "12:30 p. m. (Recomendado)");
  assert.equal(slots[1].sub, "12:45 p. m.");
  assert.equal(slots[3].sub, "Elegir hora fija");
});

test("formatClock convierte HH:MM a hora local", () => {
  assert.equal(formatClock("13:05"), "1:05 p. m.");
  assert.equal(formatClock("invalido"), "invalido");
});

test("slotLabel usa la hora personalizada", () => {
  const slots = buildSlots(new Date("2026-01-01T18:15:00Z"));
  assert.equal(slotLabel("15", slots, ""), "15 minutos (12:30 p. m.)");
  assert.equal(slotLabel("custom", slots, ""), "Horario personalizado");
  assert.equal(slotLabel("custom", slots, "14:00"), "Horario personalizado (2:00 p. m.)");
});

test("validateOrder detecta cada campo inválido", () => {
  const base = {
    qty: { revueltas: 1 },
    name: "Ana",
    phone: "78901234",
    slot: "15" as const,
    customTime: "",
  };
  assert.deepEqual(validateOrder(base), {});
  assert.ok(validateOrder({ ...base, qty: {} }).count);
  assert.ok(validateOrder({ ...base, name: "  " }).name);
  assert.ok(validateOrder({ ...base, phone: "" }).phone);
  assert.ok(validateOrder({ ...base, phone: "7890" }).phone);
  assert.ok(validateOrder({ ...base, slot: "custom" }).customTime);
  assert.deepEqual(validateOrder({ ...base, slot: "custom", customTime: "14:00" }), {});
});
