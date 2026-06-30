import type { BadgeIconName } from "../types/badges";
import institutionUrl from "../assets/icons/institution-glyph.svg";
import locationUrl from "../assets/icons/location-glyph.svg";
import tableUrl from "../assets/icons/table-glyph.svg";
import emptyChairUrl from "../assets/icons/empty-chair-glyph.svg";
import crownUrl from "../assets/icons/crown-glyph.svg";
import memberUrl from "../assets/icons/member-glyph.svg";
import ballotUrl from "../assets/icons/ballot-glyph.svg";
import banquetUrl from "../assets/icons/banquet-glyph.svg";
import ministerUrl from "../assets/icons/minister-glyph.svg";
import diplomatUrl from "../assets/icons/diplomat-glyph.svg";

const iconUrls: Record<BadgeIconName, string> = {
  institution: institutionUrl,
  location: locationUrl,
  table: tableUrl,
  emptyChair: emptyChairUrl,
  crown: crownUrl,
  member: memberUrl,
  ballot: ballotUrl,
  banquet: banquetUrl,
  minister: ministerUrl,
  diplomat: diplomatUrl,
};

type IconProps = {
  name: BadgeIconName;
  label?: string;
  size?: number;
  className?: string;
};

export function Icon({ name, label, size = 20, className = "" }: IconProps) {
  const accessibilityProps = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      className={`icon ${className}`.trim()}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${iconUrls[name]})`,
        maskImage: `url(${iconUrls[name]})`,
      }}
      {...accessibilityProps}
    />
  );
}
