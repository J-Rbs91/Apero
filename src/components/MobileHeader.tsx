import { useNavigate } from "react-router-dom";

type MobileHeaderProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  backLabel?: string;
};

export function MobileHeader({
  eyebrow,
  title,
  subtitle,
  compact = false,
  backLabel = "Retour",
}: MobileHeaderProps) {
  const navigate = useNavigate();

  function handleBack() {
    const historyIndex = window.history.state?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <header className={compact ? "mobile-header mobile-header--compact" : "mobile-header"}>
      <button type="button" className="back-button" onClick={handleBack}>
        <span className="back-button__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{backLabel}</span>
      </button>
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
