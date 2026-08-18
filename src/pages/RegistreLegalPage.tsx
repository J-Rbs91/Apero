import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";

// Mentions légales (LCEN art. 6-III) et information sur les données (RGPD
// art. 13). Le ton reste celui de la maison, mais le fond est sérieux : c'est
// la page qu'on montre quand quelqu'un demande « et mes données, alors ? ».
//
// L'architecture zero-knowledge rend cette page courte et honnête : le serveur
// ne stocke que du chiffré, et l'essentiel des données ne quitte jamais
// l'appareil. Toute évolution qui ferait sortir des données en clair vers le
// serveur doit être répercutée ici avant d'être déployée.
export function RegistreLegalPage() {
  return (
    <MobilePage overlay="deep">
      <MobileHeader eyebrow="La Confrérie" title="Le registre légal" />

      <section className="sheet">
        <h2 className="h2">Qui tient ce comptoir</h2>
        <p className="lede">
          La Confrérie du Petit Jaune est un projet personnel et non commercial :
          aucune vente, aucune publicité, aucune régie, aucun traçage.
        </p>
        <ul className="legal-list">
          <li>
            <strong>Éditeur</strong> : J-Rbs91, projet personnel édité à titre non
            professionnel.
          </li>
          <li>
            <strong>Contact</strong> : par une issue sur{" "}
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
            le compte de l’éditeur, au sein de l’Union européenne.
          </li>
        </ul>
      </section>

      <section className="sheet">
        <h2 className="h2">Ce que la Confrérie sait de toi</h2>
        <p className="lede">
          Très peu, et c’est un choix d’architecture, pas une promesse en l’air.
        </p>

        <h3 className="h3">Ce qui ne quitte jamais ton appareil</h3>
        <ul className="legal-list">
          <li>
            Ton blaze, tes apéros en cache, tes notifications et tes accusés de
            lecture vivent dans le stockage local de ton navigateur. Vider les
            données du site les efface définitivement.
          </li>
          <li>
            La clé de déchiffrement d’un apéro voyage dans le <em>fragment</em> du
            lien d’invitation (la partie après le <code>#</code>). Par construction,
            un navigateur n’envoie jamais le fragment au serveur : la clé ne peut
            donc pas arriver jusqu’à nous.
          </li>
          <li>
            Ta position géographique, si tu utilises « les rades autour de moi »,
            est lue par le navigateur et envoyée directement au service de carte.
            Elle ne transite par aucun serveur de la Confrérie.
          </li>
        </ul>

        <h3 className="h3">Ce que le serveur stocke</h3>
        <ul className="legal-list">
          <li>
            Le contenu d’un apéro (noms, dates, lieux, votes, mots du comptoir)
            est chiffré sur ton appareil <strong>avant</strong> d’être envoyé
            (AES-GCM). Le serveur ne conserve qu’un bloc illisible pour lui : il ne
            peut savoir ni qui participe, ni où, ni quand.
          </li>
          <li>
            Des empreintes de clés d’écriture, qui servent uniquement à vérifier
            qu’une modification vient bien de quelqu’un d’autorisé.
          </li>
          <li>
            Ton adresse IP, temporairement, dans les journaux techniques et le
            mécanisme anti-abus. C’est le minimum nécessaire pour empêcher qu’on
            noie le comptoir sous les requêtes.
          </li>
        </ul>
      </section>

      <section className="sheet">
        <h2 className="h2">Les services extérieurs</h2>
        <p className="lede">
          Trois services de cartographie sont appelés <em>directement par ton
          navigateur</em>, et reçoivent donc ton adresse IP au moment de l’appel :
        </p>
        <ul className="legal-list">
          <li>
            <strong>Tuiles OpenStreetMap</strong> : affichage des fonds de carte.
          </li>
          <li>
            <strong>Photon</strong> (komoot) : recherche d’adresse.
          </li>
          <li>
            <strong>Overpass</strong> : liste des bars et cafés autour de toi.
          </li>
        </ul>
        <p className="hint">
          Les polices de caractères sont hébergées sur ce site, jamais chargées
          depuis un CDN tiers : aucun appel réseau n’est fait à ton insu pour un
          simple détail typographique.
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
          , sous licence ODbL.
        </p>
      </section>

      <section className="sheet">
        <h2 className="h2">Tes droits</h2>
        <p className="lede">
          Le RGPD te donne un droit d’accès, de rectification, d’effacement,
          d’opposition et de portabilité sur tes données.
        </p>
        <ul className="legal-list">
          <li>
            <strong>Effacer tout, tout de suite</strong> : vide les données du site
            dans ton navigateur. Ce qui est local disparaît immédiatement.
          </li>
          <li>
            <strong>Supprimer un apéro du serveur</strong> : la personne qui a
            organisé l’assemblée peut le faire depuis son lien d’administration.
          </li>
          <li>
            Comme le serveur ne détient que du chiffré, il ne peut pas identifier
            une personne, ni retrouver ses données à partir de son nom : c’est la
            contrepartie logique du zero-knowledge.
          </li>
          <li>
            En cas de désaccord, tu peux saisir la{" "}
            <a href="https://www.cnil.fr/" target="_blank" rel="noreferrer">
              CNIL
            </a>
            .
          </li>
        </ul>
        <p className="hint">
          Aucun cookie de mesure d’audience, aucun traceur publicitaire, aucun
          partage à des tiers à des fins commerciales : il n’y a rien à monétiser
          dans un bloc chiffré.
        </p>
      </section>

      <section className="sheet">
        <h2 className="h2">Crédits</h2>
        <ul className="legal-list">
          <li>
            Police <strong>Manrope</strong> : The Manrope Project Authors, SIL Open
            Font License 1.1.
          </li>
          <li>
            Animation du verre : <strong>Noto Animated Emoji</strong> (Google),
            sous licence{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
            , modifiée (deux calques retirés).
          </li>
          <li>
            Images d’ambiance du comptoir : générées par IA (Google Gemini).
          </li>
          <li>
            Code source sous licence MIT, ouvert sur{" "}
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
        Ici comme ailleurs, ce qu’on porte à ses lèvres reste la souveraine affaire
        de chacun : la Confrérie organise des retrouvailles, pas des beuveries.
      </p>
    </MobilePage>
  );
}
