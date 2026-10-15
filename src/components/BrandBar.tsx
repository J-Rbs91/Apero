import { Link } from "react-router-dom";
import { requestComptoirNameEdit, useComptoirName } from "../hooks/useComptoirName";
import { WineGlassMark } from "./WineGlassMark";

// Barre de marque des écrans de premier niveau : marque (lien vers l'accueil) et
// puce « blaze » qui ouvre le changement de blaze (ex-« Changer de blaze » du
// menu déroulant de l'accueil).
export function BrandBar() {
  const { comptoirName } = useComptoirName();

  return (
    <div className="brandbar">
      <Link className="brandbar__mark" to="/" aria-label="La Confrérie du Petit Jaune — accueil">
        <WineGlassMark size={30} />
        <span>La Confrérie</span>
      </Link>
      {comptoirName && (
        <button
          type="button"
          className="blazechip"
          onClick={() => requestComptoirNameEdit()}
          aria-label={`Changer de blaze (actuellement ${comptoirName})`}
        >
          <span className="blazechip__name">{comptoirName}</span>
        </button>
      )}
    </div>
  );
}
