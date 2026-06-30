import { Link } from "react-router-dom";

export function MobileBottomBar() {
  return (
    <nav className="mobile-bottom-bar" aria-label="Navigation rapide">
      <Link className="mobile-bottom-bar__item" to="/">
        Accueil
      </Link>
      <Link className="mobile-bottom-bar__item" to="/create">
        Convoquer
      </Link>
      <a className="mobile-bottom-bar__item" href="#registre">
        Registre
      </a>
    </nav>
  );
}
