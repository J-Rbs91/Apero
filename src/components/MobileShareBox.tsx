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
    <div className="share-box">
      <p className="eyebrow">Partager la convocation</p>
      <div className="share">
        <code>{url}</code>
        <button className="cp" type="button" onClick={handleShare}>
          Copier
        </button>
      </div>
      {feedback && (
        <p className="meta" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
