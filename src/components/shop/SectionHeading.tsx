import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  action,
  align = "left",
  titleClassName = "",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  align?: "left" | "center";
  titleClassName?: string;
}) {
  return (
    <div
      className={
        align === "center"
          ? "mb-10 flex flex-col items-center text-center"
          : "mb-10 flex flex-wrap items-end justify-between gap-4"
      }
    >
      <div className={titleClassName ? `w-full ${titleClassName}` : undefined}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className={`font-display text-3xl leading-tight md:text-4xl ${titleClassName}`}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
