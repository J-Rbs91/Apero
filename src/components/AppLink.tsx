import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Link } from "react-router";
import { useAppNavigation } from "../routes/useAppNavigation";

/* Le lien interne de l'application. Il reste un VRAI lien dans le document —
   préchargeable, ouvrable dans un nouvel onglet, annoncé aux technologies
   d'assistance : seul le clic ordinaire est détourné, pour que le geste posé
   sur la pile d'historique corresponde à la position des deux écrans dans
   l'arbre plutôt qu'à l'ordre des visites.

   Le contrat et sa raison d'être sont en tête de src/routes/navigationTree.ts.

   Un `<Link>` brut reste légitime pour ce qui sort de l'application (mentions
   légales ouvertes ailleurs, lien externe) ; à l'intérieur, il rétablit le
   défaut, et c'est ce que vérifie src/routes/navigationTree.test.ts. */
type AppLinkProps = {
  to: string;
  children: ReactNode;
  state?: unknown;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function AppLink({ to, children, state, onClick, ...rest }: AppLinkProps) {
  const { aller } = useAppNavigation();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    /* Nouvel onglet, nouvelle fenêtre, téléchargement, clic du milieu : on ne
       touche à rien. Ces gestes ouvrent un contexte neuf, où la pile de
       celui-ci n'a pas cours. */
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    aller(to, state === undefined ? undefined : { state });
  }

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
