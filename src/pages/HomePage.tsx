import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="app">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">La grande assemblée des assoiffés raisonnables</p>
          <h1>La Confrérie du Petit Jaune</h1>
          <p className="hero__lead">
            Bienvenue dans La Confrérie du Petit Jaune. Ici, les apéros ne
            s’improvisent pas. Ils se convoquent, se débattent, se votent, puis
            se respectent avec la gravité d’une institution légèrement parfumée
            à la cacahuète.
          </p>
          <p className="hero__lead">
            Crée ton assemblée, propose tes dates, partage la convocation et
            laisse le peuple du comptoir déposer son suffrage.
          </p>
          <Link className="button button--primary button--large" to="/create">
            Convoquer une assemblée
          </Link>
        </div>
      </section>

      <section className="feature-band" aria-label="Fonctionnement">
        <article>
          <span>1</span>
          <h2>Un ordre ancien</h2>
          <p>Une mission simple : trouver une date sans perdre la dignité du zinc.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Un nom cérémoniel</h2>
          <p>Chaque apéro reçoit un titre pompeux, unique et très sérieux.</p>
        </article>
        <article>
          <span>3</span>
          <h2>Des registres séparés</h2>
          <p>Chaque assemblée garde son lien, ses votes et son fichier JSON.</p>
        </article>
      </section>
    </main>
  );
}
