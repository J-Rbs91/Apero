import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MobilePage } from "../components/MobilePage";
import { WineGlassMark } from "../components/WineGlassMark";
import { useGentlemanName } from "../hooks/useGentlemanName";
import { eventStorage } from "../services";

export function HomePage() {
  const { requestGentlemanNameEdit } = useGentlemanName();

  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // La purge ne doit pas empêcher l’accueil de s’afficher.
    });
  }, []);

  return (
    <MobilePage className="home-mobile" overlay="scene">
      <div className="brandpill">
        <WineGlassMark size={26} /> La Confrérie
      </div>

      <div className="grow" />

      <section className="sheet">
        <p className="eyebrow">Institution officieuse du comptoir</p>
        <hr className="accent" />
        <h1 className="h1">La Confrérie du Petit Jaune</h1>
        <p className="lede">La démocratie du zinc, enfin dans ta poche.</p>
        <Link className="button button--primary button--block" to="/create">
          Convoquer une assemblée
        </Link>
        <p className="meta meta--center">Propose · partage · le comptoir tranche</p>
      </section>

      <nav className="home-links">
        <Link className="ghost-link" to="/palmares">
          Le palmarès de la Confrérie
        </Link>
        <button className="ghost-link" type="button" onClick={requestGentlemanNameEdit}>
          Modifier mon nom de gentleman
        </button>
      </nav>
    </MobilePage>
  );
}
