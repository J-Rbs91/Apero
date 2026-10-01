import type { ReactNode } from "react";

type MobilePageProps = {
  children: ReactNode;
  className?: string;
  overlay?: "scene" | "deep";
};

export function MobilePage({ children, className = "", overlay = "scene" }: MobilePageProps) {
  return (
    <main className={`mobile-page ${className}`.trim()}>
      <div className={`screen-overlay screen-overlay--${overlay}`} aria-hidden />
      <div className="mobile-page__inner">{children}</div>
    </main>
  );
}
