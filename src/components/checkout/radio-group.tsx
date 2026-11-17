import { Icon } from "./ui";

type RadioOption<T extends string> = {
  id: T;
  title: string;
  sub?: string;
  icon?: string;
};

const CARD_BASE =
  "flex flex-col rounded-lg text-left transition bg-surface-container text-on-surface hover:bg-surface-container-high peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2";
const CARD_ACTIVE_PRIMARY =
  "peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant peer-checked:shadow-sm";
const CARD_ACTIVE_SECONDARY =
  "peer-checked:bg-secondary-fixed peer-checked:text-on-secondary-fixed peer-checked:shadow-sm";
const PILL_BASE =
  "inline-block px-2.5 py-1 rounded-full font-label-sm text-label-sm transition bg-surface-container text-on-surface hover:bg-surface-container-high peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2";
const PILL_ACTIVE = "peer-checked:bg-primary peer-checked:text-on-primary";

export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  variant = "card",
  tone = "primary",
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
  variant?: "card" | "pill";
  tone?: "primary" | "secondary";
}) {
  return (
    <fieldset className={variant === "pill" ? "flex gap-1.5" : "grid grid-cols-2 gap-2"}>
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <label key={option.id} className="relative cursor-pointer">
            <input
              checked={active}
              className="peer sr-only"
              name={name}
              onChange={() => onChange(option.id)}
              type="radio"
              value={option.id}
            />
            {variant === "pill" ? (
              <span className={`${PILL_BASE} ${PILL_ACTIVE}`}>{option.title}</span>
            ) : (
              <span
                className={`${CARD_BASE} ${tone === "secondary" ? "p-3" : "p-2.5"} ${tone === "secondary" ? CARD_ACTIVE_SECONDARY : CARD_ACTIVE_PRIMARY}`}
              >
                <span className="flex items-center justify-between w-full">
                  <span className="font-label-lg text-label-lg font-bold">{option.title}</span>
                  {option.icon ? (
                    active ? (
                      <Icon name="check_circle" className="text-[16px] text-primary" />
                    ) : (
                      <Icon name={option.icon} className="text-[16px] text-tertiary" />
                    )
                  ) : active ? (
                    <Icon name="radio_button_checked" className="text-[18px]" />
                  ) : (
                    <Icon name="radio_button_unchecked" className="text-[18px]" />
                  )}
                </span>
                {option.sub && (
                  <span
                    className={`mt-0.5 font-body-sm text-body-sm ${
                      active
                        ? `text-current ${tone === "secondary" ? "opacity-80" : "opacity-90"}`
                        : "text-on-surface-variant"
                    }`}
                  >
                    {option.sub}
                  </span>
                )}
              </span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
