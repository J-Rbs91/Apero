import type { ComponentPropsWithoutRef } from "react";

type TicketCardProps = ComponentPropsWithoutRef<"section">;

export function TicketCard({ children, className = "", ...sectionProps }: TicketCardProps) {
  return (
    <section className={`ticket-card ${className}`.trim()} {...sectionProps}>
      {children}
    </section>
  );
}
