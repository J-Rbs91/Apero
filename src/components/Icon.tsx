// Jeu de pictogrammes du design system (docs/uxer/manifesto-void/UXER_DESIGN_SYSTEM.md §5.1) :
// SVG monochromes en ligne, trait de 1,5, extrémités carrées, currentColor.
// Aucun emoji, aucun fichier tiers.

import type { ReactElement } from "react";

export type IconName =
  | "back"
  | "check"
  | "maybe"
  | "close"
  | "bell"
  | "calendar"
  | "rosette"
  | "home"
  | "pin"
  | "share"
  | "copy"
  | "chevron"
  | "plus";

const PATHS: Record<IconName, ReactElement> = {
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.6 4.6L19 7.4" />,
  maybe: (
    <>
      <path d="M9.1 9.3a3 3 0 1 1 4.4 2.7c-1 .5-1.5 1.1-1.5 2.1" />
      <path d="M12 18.4v.2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  rosette: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.4L7.5 21l4.5-2.6 4.5 2.6-1.5-7.6" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5.5 10v10h13V10M10 20v-6h4v6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  share: <path d="M4 13v6h16v-6M12 15V3M8 7l4-4 4 4" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5h10" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
