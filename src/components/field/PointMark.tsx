// La marque de la Confrérie : le Petit Jaune, un point plein. Elle remplace le
// verre animé dans les en-têtes ; le verre ne vit plus que dans l'écran
// d'ouverture (UXER_REDESIGN_CONTRACT.md §3).
export function PointMark({ className }: { className?: string }) {
  return <span className={className ? `point-mark ${className}` : "point-mark"} aria-hidden="true" />;
}
