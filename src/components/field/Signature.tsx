import { useMemo } from "react";
import { signatureBars } from "../../utils/signalMath";

type SignatureProps = {
  /** Identifiant PUBLIC de l'assemblée ou de la tablée (jamais une clé). */
  seed: string;
  className?: string;
};

// Signature d'assemblée : une bande binaire déterministe calculée depuis
// l'identifiant public. Même apéro, même signature, sur tous les écrans et
// tous les appareils (UXER_DESIGN_SYSTEM.md §8). Purement visuelle.
export function Signature({ seed, className }: SignatureProps) {
  const { bars, length } = useMemo(() => signatureBars(seed), [seed]);

  return (
    <svg
      className={className ? `signature ${className}` : "signature"}
      viewBox={`0 0 ${length} 1`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.width} height={1} />
      ))}
    </svg>
  );
}
