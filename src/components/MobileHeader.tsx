import { useNavigate } from "react-router-dom";

type MobileHeaderProps = {
  eyebrow: string;
  title?: string;
  meta?: string;
};

export function MobileHeader({ eyebrow, title, meta }: MobileHeaderProps) {
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
    <header className="screen-head">
      <div className="backrow">
        <button type="button" className="bk" onClick={handleBack} aria-label="Retour">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="eyebrow">{eyebrow}</p>
      </div>
      {title && <h1 className="h1 h1--sm screen-head__title">{title}</h1>}
      {meta && <p className="meta">{meta}</p>}
    </header>
  );
}
