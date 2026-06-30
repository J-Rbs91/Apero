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
          title: "La Confrérie du Petit Jaune",
          text: "Viens voter pour l’assemblée du comptoir.",
          url,
        });
        setFeedback("Lien partagé.");
        return;
      } catch {
        setFeedback("");
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Lien copié.");
    } catch {
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  return (
    <div className="mobile-share-box mobile-share-box--receipt">
      <div>
        <p className="eyebrow">Ticket de rameutage</p>
        <h2>Partager la convocation</h2>
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
