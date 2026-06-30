import type { ReactNode } from "react";

type MobilePageProps = {
  children: ReactNode;
  className?: string;
};

export function MobilePage({ children, className = "" }: MobilePageProps) {
  return <main className={`mobile-page ${className}`.trim()}>{children}</main>;
}
