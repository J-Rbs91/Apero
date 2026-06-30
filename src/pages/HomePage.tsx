import { Link } from "react-router-dom";
import { AperoOrnaments } from "../components/AperoOrnaments";
import { MobileBottomBar } from "../components/MobileBottomBar";
import { MobilePage } from "../components/MobilePage";
import comptoirScene from "../assets/art/comptoir-reference.png";

export function HomePage() {
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
          <h1>La Confrerie du Petit Jaune</h1>
          <p className="hero__lead">La democratie du zinc, enfin dans ta poche.</p>
          <p className="hero__lead hero__lead--compact">
            Propose des dates, envoie le lien, laisse le comptoir voter en moins de trente secondes.
          </p>
          <Link className="button button--primary button--large button--block" to="/create">
            Convoquer une assemblee
          </Link>
        </div>
      </section>

      <AperoOrnaments variant="counter" />

      <section className="mobile-steps" aria-label="Fonctionnement">
        <article>
          <span>1</span>
          <h2>Propose tes dates</h2>
          <p>Une convocation courte, quelques creneaux, et c'est parti.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Envoie le lien</h2>
          <p>WhatsApp, SMS, Messenger, Discord. Un clic suffit pour rameuter la tablee.</p>
        </article>
        <article id="registre">
          <span>3</span>
          <h2>Laisse voter le comptoir</h2>
          <p>Nom, choix, contribution. Le suffrage se depose sans zoom ni tableau.</p>
        </article>
      </section>

      <section className="secondary-links comptoir-notice">
        <p className="eyebrow">Registre de service</p>
        <h2>Un mini PMU pour trancher l'apero</h2>
        <p>
          Pas de tableur, pas de debat interminable. Une convocation, des bulletins, un verdict.
        </p>
        <Link className="button button--secondary button--block" to="/create">
          Ouvrir le registre
        </Link>
      </section>

      <footer className="comptoir-footer">
        <p>Olives, tickets, zinc et suffrage populaire.</p>
      </footer>

      <MobileBottomBar />
    </MobilePage>
  );
}
