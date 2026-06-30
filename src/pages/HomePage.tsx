import { Link } from "react-router-dom";
import { MobileBottomBar } from "../components/MobileBottomBar";
import { MobilePage } from "../components/MobilePage";

export function HomePage() {
  return (
    <MobilePage className="home-mobile">
      <section className="hero hero--mobile">
        <div className="hero__content hero__content--mobile">
          <p className="eyebrow">La grande assemblee des assoiffes raisonnables</p>
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

      <section className="secondary-links">
        <Link className="button button--secondary button--block" to="/create">
          Ouvrir le registre
        </Link>
      </section>

      <MobileBottomBar />
    </MobilePage>
  );
}
