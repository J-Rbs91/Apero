import type { ReactNode } from "react";

type MobilePageProps = {
  children: ReactNode;
  className?: string;
  /** « registre » : voile du plan calibré, pour les écrans migrés au registre. */
  overlay?: "scene" | "deep" | "registre";
};

export function MobilePage({ children, className = "", overlay = "scene" }: MobilePageProps) {
  return (
    <main className={`mobile-page ${className}`.trim()}>
      <div className={`screen-overlay screen-overlay--${overlay}`} aria-hidden />
      <div className="mobile-page__inner">{children}</div>
    </main>
  );
}
