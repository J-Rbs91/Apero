import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandMenu } from "../components/BrandMenu";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";

export function HomePage() {
  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // La purge ne doit pas empêcher l’accueil de s’afficher.
    });
  }, []);

  return (
    <MobilePage className="home-mobile" overlay="scene">
      <BrandMenu />

      <div className="grow" />

      <section className="sheet">
        <p className="eyebrow">Institution officieuse du comptoir</p>
        <hr className="accent" />
        <h1 className="h1">La Confrérie du Petit Jaune</h1>
        <p className="lede">
          La démocratie du zinc, pour toute la tablée, parce qu'au fond, choisir une date d'apéro,
          c'est déjà de la politique, et la politique, si on la laisse aux autres, elle se fait
          sans nous — et ça, c'est le drame.
        </p>
        <p className="hint">
          Pastaga, pinard, soft, Perrier ou juste des cacahuètes en guise de carburant
          existentiel : la tablée s'équipe comme elle veut, mais personne n'a le droit de fuir le
          scrutin, parce que la démocratie ne s'arrête pas au comptoir, figure-toi.
        </p>
        <Link className="button button--primary button--block" to="/create">
          Convoquer une assemblée
        </Link>
        <p className="meta meta--center">Propose · partage · le comptoir tranche</p>
      </section>
    </MobilePage>
  );
}
