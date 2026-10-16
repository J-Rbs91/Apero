import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";

// Mentions légales (LCEN art. 6-III) et information sur les données (RGPD
// art. 13). Voix minimaliste (UXER_VOICE V13) : listes nominales, aucun fait
// retiré. C'est la page qu'on montre quand quelqu'un demande où vont ses données.
//
// L'architecture zero-knowledge rend cette page courte et honnête : le serveur
// ne stocke que du chiffré, et l'essentiel des données ne quitte jamais
// l'appareil. Toute évolution qui ferait sortir des données en clair vers le
// serveur doit être répercutée ici avant d'être déployée.
export function RegistreLegalPage() {
  return (
    <MobilePage
      className="legal-page"
      header={<MobileHeader eyebrow="La Confrérie" />}
      hero={<h1 className="h1 h1--sm">Mentions légales</h1>}
    >
      <section className="sheet">
        <h2 className="h2">Éditeur</h2>
        <ul className="legal-list">
          <li>
            <strong>Éditeur</strong> : J-Rbs91, projet personnel, édité à titre non
            professionnel.
          </li>
          <li>
            <strong>Nature</strong> : non commerciale. Aucune vente, aucune publicité,
            aucune régie, aucun traçage.
          </li>
          <li>
            <strong>Contact</strong> : issue sur{" "}
            <a
              href="https://github.com/J-Rbs91/Apero/issues"
              target="_blank"
              rel="noreferrer"
            >
              le dépôt public du projet
            </a>
            .
          </li>
          <li>
            <strong>Hébergement du site</strong> : GitHub Pages (GitHub, Inc.,
            88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis).
          </li>
          <li>
            <strong>Hébergement de l’API</strong> : serveur privé (VPS) opéré pour
            le compte de l’éditeur, Union européenne.
          </li>
        </ul>
      </section>

      <section className="sheet">
        <h2 className="h2">Données</h2>

        <h3 className="h3">Sur l’appareil uniquement</h3>
        <ul className="legal-list">
          <li>
            Nom, apéros en cache, notifications, accusés de lecture : stockage local
            du navigateur. Effacement définitif en vidant les données du site.
          </li>
          <li>
            Clé de déchiffrement d’un apéro : dans le <em>fragment</em> du lien
            d’invitation (après le <code>#</code>). Fragment jamais envoyé au serveur
            par le navigateur, donc clé jamais reçue par le serveur.
          </li>
          <li>
            Position géographique (recherche de lieux à proximité) : lue par le
            navigateur, envoyée directement au service de carte, sans passage par un
            serveur de la Confrérie.
          </li>
        </ul>

        <h3 className="h3">Sur le serveur</h3>
        <ul className="legal-list">
          <li>
            Contenu d’un apéro (noms, dates, lieux, réponses, messages) : chiffré
            sur l’appareil <strong>avant</strong> envoi (AES-GCM). Bloc illisible pour
            le serveur : ni participants, ni lieu, ni date.
          </li>
          <li>
            Empreintes des clés d’écriture : vérification des modifications
            autorisées, sans autre usage.
          </li>
          <li>
            Adresse IP : conservation temporaire, journaux techniques et protection
            anti-abus.
          </li>
        </ul>
      </section>

      <section className="sheet">
        <h2 className="h2">Services tiers</h2>
        <p className="lede">
          Appels <em>directs depuis le navigateur</em>, avec transmission de
          l’adresse IP à chaque appel :
        </p>
        <ul className="legal-list">
          <li>
            <strong>Tuiles OpenStreetMap</strong> : fonds de carte.
          </li>
          <li>
            <strong>Photon</strong> (komoot) : recherche d’adresse.
          </li>
          <li>
            <strong>Overpass</strong> : bars et cafés à proximité.
          </li>
        </ul>
        <p className="hint">
          Polices hébergées sur ce site. Aucun chargement depuis un CDN tiers.
        </p>
        <p className="hint">
          Données cartographiques ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            les contributeurs OpenStreetMap
          </a>
          , licence ODbL.
        </p>
      </section>

      <section className="sheet">
        <h2 className="h2">Droits</h2>
        <p className="lede">
          RGPD : droits d’accès, de rectification, d’effacement, d’opposition et de
          portabilité.
        </p>
        <ul className="legal-list">
          <li>
            <strong>Effacement local</strong> : vider les données du site dans le
            navigateur. Suppression immédiate.
          </li>
          <li>
            <strong>Suppression d’un apéro sur le serveur</strong> : par l’hôte,
            depuis son lien d’administration.
          </li>
          <li>
            Identification impossible côté serveur : données chiffrées, aucune
            recherche possible par nom.
          </li>
          <li>
            Réclamation :{" "}
            <a href="https://www.cnil.fr/" target="_blank" rel="noreferrer">
              CNIL
            </a>
            .
          </li>
        </ul>
        <p className="hint">
          Aucun cookie de mesure d’audience. Aucun traceur publicitaire. Aucun
          partage avec des tiers à des fins commerciales.
        </p>
      </section>

      <section className="sheet">
        <h2 className="h2">Crédits</h2>
        <ul className="legal-list">
          <li>
            Polices <strong>Archivo</strong> (The Archivo Project Authors) et{" "}
            <strong>Fragment Mono</strong> (The Fragment-Mono Project Authors) : SIL
            Open Font License 1.1.
          </li>
          <li>
            Animation du verre : <strong>Noto Animated Emoji</strong> (Google),
            licence{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
            , modifiée (2 calques retirés).
          </li>
          <li>
            Code source : licence MIT,{" "}
            <a
              href="https://github.com/J-Rbs91/Apero"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </li>
        </ul>
      </section>

      <p className="legal-sobriety">
        L’abus d’alcool est dangereux pour la santé. À consommer avec modération.
      </p>
    </MobilePage>
  );
}
