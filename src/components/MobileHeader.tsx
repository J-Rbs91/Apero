import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

type MobileHeaderProps = {
  eyebrow: string;
  title?: string;
  meta?: string;
};

// Rangée « retour » des écrans de tâche (création, invitation) : bouton icône de
// 44 px + nom de la page. Le titre éventuel est peint sur l'enseigne.
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
    <div className="backrow">
      <button type="button" className="bk" onClick={handleBack} aria-label="Retour">
        <Icon name="back" size={22} />
      </button>
      <p className="backrow__label">{eyebrow}</p>
      {title && <h1 className="h1 h1--sm screen-head__title">{title}</h1>}
      {meta && <p className="meta">{meta}</p>}
    </div>
  );
}
