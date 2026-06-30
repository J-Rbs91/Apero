import { Link } from "react-router-dom";

type MobileHeaderProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function MobileHeader({
  eyebrow,
  title,
  subtitle,
  compact = false,
}: MobileHeaderProps) {
  return (
    <header className={compact ? "mobile-header mobile-header--compact" : "mobile-header"}>
      <Link className="brand-link brand-link--mobile" to="/">
        <span className="brand-mark">CJ</span>
        <span>La Confrerie du Petit Jaune</span>
      </Link>
      {(eyebrow || title || subtitle) && (
        <div className="mobile-header__copy">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h1>{title}</h1>}
          {subtitle && <p className="mobile-header__subtitle">{subtitle}</p>}
        </div>
      )}
    </header>
  );
}
