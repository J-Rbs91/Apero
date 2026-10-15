import type { ReactNode } from "react";

type DisclosureProps = {
  /** Titre du volet replié. */
  title: string;
  /** Ce qu'on trouve dedans, pour décider sans ouvrir. */
  summary?: string;
  /** Compteur affiché à droite du titre (messages, convives…). */
  badge?: string | number;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * Volet repliable natif : le secondaire reste accessible sans encombrer la
 * page. Bâti sur <details>, donc ouvrable au clavier et cherchable par le
 * navigateur sans une ligne de JavaScript.
 */
export function Disclosure({
  title,
  summary,
  badge,
  defaultOpen = false,
  children,
}: DisclosureProps) {
  return (
    <details className="disclose" open={defaultOpen}>
      <summary className="disclose__head">
        <span className="disclose__text">
          <span className="disclose__title">{title}</span>
          {summary && <span className="disclose__summary">{summary}</span>}
        </span>
        {badge != null && <span className="disclose__badge">{badge}</span>}
        <svg
          className="disclose__chevron"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="disclose__body">{children}</div>
    </details>
  );
}
