import type { ReactNode } from "react";

export function Icon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? "icon-fill" : ""} ${className}`}
    >
      {name}
    </span>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl bg-surface-container-lowest p-space-md shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  icon,
  title,
  aside,
  tone = "primary",
  spacing = "xs",
}: {
  icon: string;
  title: string;
  aside?: ReactNode;
  tone?: "primary" | "secondary";
  spacing?: "xs" | "sm";
}) {
  return (
    <div
      className={`flex items-center justify-between ${spacing === "sm" ? "mb-space-sm" : "mb-space-xs"}`}
    >
      <div className="flex items-center gap-space-xs">
        <Icon
          name={icon}
          className={`${tone === "secondary" ? "text-secondary" : "text-primary"} text-[20px]`}
        />
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      </div>
      {aside}
    </div>
  );
}
