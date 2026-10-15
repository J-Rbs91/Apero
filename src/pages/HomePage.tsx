import { useEffect } from "react";
import { Link } from "react-router-dom";
import zincIllustration from "../assets/art/Le-zinc.jpg";
import { BrandBar } from "../components/BrandBar";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";

export function HomePage() {
  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // La purge ne doit pas empêcher l’accueil de s’afficher.
    });
  }, []);

  return (
    <MobilePage
      className="home-mobile"
      nav
      header={<BrandBar />}
      hero={
        <div className="sign">
          <div className="sign__text">
            <h1 className="h1">
              La Confrérie du <span className="h1__pop">Petit Jaune</span>
            </h1>
            <p className="lede">
              Le zinc décide, pour toute la tablée. Choisir une date d'apéro, c'est plus sérieux
              qu'il n'y paraît.
            </p>
            <Link className="button button--primary button--block button--on-facade" to="/create">
              Organiser un apéro
            </Link>
          </div>
          <div className="window" aria-hidden="true">
            <img src={zincIllustration} alt="" width="1376" height="782" />
          </div>
        </div>
      }
    >
      <div className="home-body">
        <div className="home-body__text">
          <p className="hint">
            Pastaga, pinard, soft, Perrier ou juste des cacahuètes : la tablée s'équipe comme elle
            veut, mais personne n'a le droit de se défiler, figure-toi.
          </p>
          <p className="meta meta--center">Propose · partage · le comptoir tranche</p>
        </div>
      </div>
    </MobilePage>
  );
}
