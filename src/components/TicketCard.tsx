import type { ReactNode } from "react";

type TicketCardProps = {
  children: ReactNode;
  className?: string;
};

export function TicketCard({ children, className = "" }: TicketCardProps) {
  return <section className={`ticket-card ${className}`}>{children}</section>;
}
