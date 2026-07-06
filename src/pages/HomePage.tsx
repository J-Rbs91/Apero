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
          Le zinc décide, pour toute la tablée. Choisir une date d'apéro, c'est plus sérieux qu'il
          n'y paraît.
        </p>
        <p className="hint">
          Nous ne saurions présumer de ce que tu porteras à tes lèvres, ni sous quelle toiture, ou
          pas, tu le porteras. Ces détails demeurent ta souveraine affaire. En revanche nul ne
          saurait se dérober à la question qui vient, ça, jamais.
        </p>
        <Link className="button button--primary button--block" to="/create">
          Organiser un apéro
        </Link>
        <p className="meta meta--center">Propose · partage · le comptoir tranche</p>
      </section>
    </MobilePage>
  );
}
