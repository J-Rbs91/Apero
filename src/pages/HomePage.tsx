import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="app">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Mini Doodle de comptoir</p>
          <h1>Apero PMU</h1>
          <p className="hero__lead">
            La democratie du zinc. Pose les creneaux, rameute les piliers,
            laisse parler le scrutin. Un Doodle, mais avec l'odeur des
            cacahuetes.
          </p>
          <Link className="button button--primary button--large" to="/create">
            Lancer un apero
          </Link>
        </div>
      </section>

      <section className="feature-band" aria-label="Fonctionnement">
        <article>
          <span>1</span>
          <h2>Un apero</h2>
          <p>Chaque scrutin a son lien et son fichier JSON. Pas de table globale.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Des options completes</h2>
          <p>Date, heure, lieu et note : on vote sur une vraie proposition.</p>
        </article>
        <article>
          <span>3</span>
          <h2>Des votes separes</h2>
          <p>Les participants de Jojo ne polluent jamais l'apero de Dede.</p>
        </article>
      </section>
    </main>
  );
}
