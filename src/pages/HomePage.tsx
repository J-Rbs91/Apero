import { useEffect } from "react";
import { Link } from "react-router-dom";
import comptoirScene from "../assets/art/comptoir-background.jpg";
import { MobileBottomBar } from "../components/MobileBottomBar";
import { MobilePage } from "../components/MobilePage";
import { useGentlemanName } from "../hooks/useGentlemanName";
import { eventStorage } from "../services";

export function HomePage() {
  const { gentlemanName, requestGentlemanNameEdit } = useGentlemanName();

  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // La purge ne doit pas empêcher l’accueil de s’afficher.
    });
  }, []);

  return (
    <MobilePage className="home-mobile">
      <section
        className="hero hero--mobile hero--scene"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(12, 36, 28, 0.1), rgba(12, 36, 28, 0.9) 62%, rgba(12, 36, 28, 0.97)), url(${comptoirScene})`,
        }}
      >
        <div className="hero__content hero__content--mobile">
          <p className="eyebrow eyebrow--pastis">Institution officieuse du comptoir</p>
          <h1>La Confrérie du Petit Jaune</h1>
          <p className="hero__lead">La démocratie du zinc, enfin dans ta poche.</p>
          <p className="hero__lead hero__lead--compact">
            Propose des dates, envoie le lien, laisse le comptoir voter en moins de trente secondes.
          </p>
          <Link className="button button--primary button--large button--block" to="/create">
            Convoquer une assemblée
          </Link>
        </div>
      </section>

      <section className="mobile-steps" aria-label="Fonctionnement">
        <article>
          <span>1</span>
          <h2>Propose tes dates</h2>
          <p>Une convocation courte, quelques créneaux, et c’est parti.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Envoie le lien</h2>
          <p>WhatsApp, SMS, Messenger, Discord. Un clic suffit pour rameuter la tablée.</p>
        </article>
        <article id="registre">
          <span>3</span>
          <h2>Laisse voter le comptoir</h2>
          <p>Nom, choix, contribution. Le suffrage se dépose sans zoom ni tableau.</p>
        </article>
      </section>

      <section className="secondary-links comptoir-notice">
        <p className="eyebrow">Registre de service</p>
        <h2>Un mini PMU pour trancher l’apéro</h2>
        <p>
          Pas de tableur, pas de débat interminable. Une convocation, des bulletins, un verdict.
        </p>
        <Link className="button button--secondary button--block" to="/create">
          Ouvrir le registre
        </Link>
      </section>

      <section className="secondary-links gentleman-name-card">
        <p className="eyebrow">Registre personnel</p>
        <h2>{gentlemanName}</h2>
        <button className="button button--secondary button--block" type="button" onClick={requestGentlemanNameEdit}>
          Modifier mon nom de gentleman
        </button>
      </section>

      <footer className="comptoir-footer">
        <p>Olives, tickets, zinc et suffrage populaire.</p>
      </footer>

      <MobileBottomBar />
    </MobilePage>
  );
}