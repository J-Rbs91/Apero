import { useState } from "react";

type MobileShareBoxProps = {
  url: string;
};

export function MobileShareBox({ url }: MobileShareBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "La Confrerie du Petit Jaune",
          text: "Viens voter pour l'assemblee du comptoir.",
          url,
        });
        setFeedback("Lien partage.");
        return;
      } catch {
        setFeedback("");
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Lien copie.");
    } catch {
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  return (
    <div className="mobile-share-box">
      <div>
        <p className="eyebrow">Lien de partage</p>
        <p className="mobile-share-box__url">{url}</p>
      </div>
      <button className="button button--secondary button--block" type="button" onClick={handleShare}>
        Partager le lien
      </button>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
