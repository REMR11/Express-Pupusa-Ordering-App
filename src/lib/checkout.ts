export type Masa = "maiz" | "arroz";
export type Curtido = "normal" | "extra";
export type Salsa = "bote" | "bolsa";
export type Slot = "15" | "30" | "45" | "custom";
export type BadgeTone = "popular" | "neutral" | "special";

export type Pupusa = {
  key: string;
  name: string;
  priceCents: number;
  desc: string;
  img: string;
  defaultQty?: number;
  badge?: { label: string; tone: BadgeTone; icon?: string };
};

export type SlotOption = { id: Slot; title: string; sub: string; icon: string };

export type OrderErrors = Partial<
  Record<"count" | "name" | "phone" | "customTime", string>
>;

export type OrderInput = {
  qty: Record<string, number>;
  name: string;
  phone: string;
  slot: Slot;
  customTime: string;
};

export const PUPUSAS: Pupusa[] = [
  {
    key: "revueltas",
    name: "Revuelta",
    priceCents: 135,
    defaultQty: 2,
    desc: "Chicharrón de la casa, frijol colado y quesillo derretido.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUOrbPiDPrFZIwi_Ikbp5fgsqO3ohCWGplMPn5fGneeilo-u8rP9H7bp1GM8keyIF7WDHUMj-2g0QGDuq2ilA4IufbiXFsL9omFenfYpf1lO4vlYXzL5fcrgBPk9LQOEMDdLsU7pOm6CO9zlE4MNnMLEWhlHy8HkL89_mi7qYhI4lL0bLoKXuKNLgTykEd4Amix6IWAXoEfSjsQvFH4HQKUr1alZ6dLebxXuwgBT4",
    badge: { label: "Más pedida", tone: "popular", icon: "star" },
  },
  {
    key: "loroco",
    name: "Queso con Loroco",
    priceCents: 150,
    defaultQty: 1,
    desc: "Quesillo artesanal cremoso y flor de loroco fresca fragante.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-1uS0iA51okp0NTSyiucbOvOct6AXwV2YB9aMMe-x9spsXL7ZN1FvvDbOAczz3bjbitnmGOQ0BsXgHDr6zQdgWNEvoG2yXTuR7W3yqcO3_iFxTow3WZ-53enGukeDw0XlmKKs_Vz66M9eol6Myv2xrbwxDHF-TGBZ3t6UpBNl6VUs-sT_XaUmm2bRAcBNUP5mq8hL2UMS9d8QhyclDIb16fNXWF3SwKh1MthN6Ds",
    badge: { label: "Favorito", tone: "neutral" },
  },
  {
    key: "frijol",
    name: "Frijol con Queso",
    priceCents: 125,
    desc: "Frijoles rojos de seda fritos a fuego lento con suave queso.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNVF-EDGRtOPZNS1nbNICHn9QZAcIBbhexf657Kku6gAYrWfnh-6UL0qK8FzhSollN5SQdBj3RylngNHigpITUqG-6UpM3EEaZiG6fdZru3bYGNHd2HzkfAW_n-9cfWFM4plXuSPTcua2wfwvL9eqazuiV_NdQ6vW5wgzikJAlwLnQzCeuDFgqSFzbogO1jna3czAtyCXsDIyvj2xGTgIB4or_vyEctBKfx8WIiYk",
    badge: { label: "Clásico", tone: "neutral" },
  },
  {
    key: "chicharron",
    name: "Chicharrón con Queso",
    priceCents: 140,
    desc: "Chicharrón molido sazonado con tomate criollo y quesillo.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvjJlBMrof0SC_4Vc7Ab8YHuhpA7tXNzrpfo11T-0Z57F6JNxwuJTpgSyMGFo5ifNq6KfemWniIZPMzYdEHZ2pxSF5eQBaHISJGIe_JCq7EpBzdvJCVc7cQL4ACFPiV3TDuXCYM0EJRFtEKUK8zQuknmM_pW7BTwRhzxYEPc7ZO7qycxKH5iywxhTtZcv_a3ivr15fSmWSZ0EbvBC9y9jxc5QL-bmPBV0UJiD5ZDY",
  },
  {
    key: "especial",
    name: "Jalapeño, Queso y Ayote",
    priceCents: 175,
    desc: "Toque picantito con ayotillo tierno rallado y quesillo abundante.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ5VemAvjJ0KREmIa38iJ0oIYyR13RleM_izVR2D6Utr72p77N_vlS2WakkvmWSYqeO_acVayDv4U1j18BiPg8lmJjqqtNVkn-Y_eCvG_jmjLmoBN1hYkMPiDTJN1RI3Mf_1jn44mDhKoluCdAXKIr0Caq5vZAkBxcXrNvVkY6gdCkg--S43cO75EG47ryNq-dKaftwknecOKpqXYH5tJVYp27UPFJRIqFsXgAcH8",
    badge: { label: "Especial", tone: "special", icon: "whatshot" },
  },
];

export const BADGE_TONES: Record<BadgeTone, string> = {
  popular: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
  special: "bg-primary-fixed text-on-primary-fixed-variant",
};

export const MASA_LABELS: Record<Masa, string> = { maiz: "Maíz", arroz: "Arroz" };

export const MASA_OPTIONS: { id: Masa; title: string; sub: string }[] = [
  { id: "maiz", title: "Maíz Tradicional", sub: "Sabor casero, suave y dorado" },
  { id: "arroz", title: "Arroz Tostadita", sub: "Crujiente, receta de Olocuilta" },
];

export const CURTIDO_OPTIONS: { id: Curtido; title: string }[] = [
  { id: "normal", title: "Normal" },
  { id: "extra", title: "Extra Curtido" },
];

export const SALSA_OPTIONS: { id: Salsa; title: string }[] = [
  { id: "bote", title: "Bote Térmico" },
  { id: "bolsa", title: "En Bolsa" },
];

const SLOT_OFFSETS: { id: Slot; minutes: number | null; title: string; icon: string }[] = [
  { id: "15", minutes: 15, title: "En 15 min", icon: "schedule" },
  { id: "30", minutes: 30, title: "En 30 min", icon: "schedule" },
  { id: "45", minutes: 45, title: "En 45 min", icon: "schedule" },
  { id: "custom", minutes: null, title: "Personalizado", icon: "edit_calendar" },
];

const clockFormat = new Intl.DateTimeFormat("es-SV", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/El_Salvador",
});

const usd = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });

export const money = (cents: number) => usd.format(cents / 100);

export function buildSlots(now: Date): SlotOption[] {
  return SLOT_OFFSETS.map((s) => ({
    id: s.id,
    title: s.title,
    sub:
      s.minutes === null
        ? "Elegir hora fija"
        : `${clockFormat.format(new Date(now.getTime() + s.minutes * 60_000))}${
            s.id === "15" ? " (Recomendado)" : ""
          }`,
    icon: s.icon,
  }));
}

export const SLOT_FALLBACK: SlotOption[] = SLOT_OFFSETS.map((s) => ({
  id: s.id,
  title: s.title,
  sub: s.minutes === null ? "Elegir hora fija" : "",
  icon: s.icon,
}));

export function formatClock(hhmm: string): string {
  const date = new Date(`2000-01-01T${hhmm}:00-06:00`);
  if (Number.isNaN(date.getTime())) return hhmm;
  return clockFormat.format(date);
}

export function slotLabel(slot: Slot, slots: SlotOption[], customTime: string): string {
  if (slot === "custom") {
    return customTime ? `Horario personalizado (${formatClock(customTime)})` : "Horario personalizado";
  }
  const option = slots.find((s) => s.id === slot);
  return option ? `${slot} minutos (${option.sub.replace(" (Recomendado)", "")})` : "";
}

export function initialQty(pupusas: Pupusa[] = PUPUSAS): Record<string, number> {
  return Object.fromEntries(pupusas.map((p) => [p.key, p.defaultQty ?? 0]));
}

export function computeTotals(
  qty: Record<string, number>,
  pupusas: Pupusa[] = PUPUSAS,
): { count: number; totalCents: number } {
  let count = 0;
  let totalCents = 0;
  for (const pupusa of pupusas) {
    const q = qty[pupusa.key] ?? 0;
    count += q;
    totalCents += pupusa.priceCents * q;
  }
  return { count, totalCents };
}

export function validateOrder(input: OrderInput, pupusas: Pupusa[] = PUPUSAS): OrderErrors {
  const errors: OrderErrors = {};

  if (computeTotals(input.qty, pupusas).count === 0) {
    errors.count = "Selecciona al menos una pupusa para comenzar.";
  }
  if (!input.name.trim()) {
    errors.name = "Escribe el nombre para el retiro.";
  }

  const digits = input.phone.replace(/\D/g, "");
  if (!digits) {
    errors.phone = "Escribe tu WhatsApp para avisarte.";
  } else if (digits.length !== 8) {
    errors.phone = "El WhatsApp debe tener 8 dígitos.";
  }

  if (input.slot === "custom" && !input.customTime) {
    errors.customTime = "Elige la hora de retiro.";
  }

  return errors;
}
