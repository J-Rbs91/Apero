import { useState } from "react";

type ShareLinkBoxProps = {
  url: string;
};

export function ShareLinkBox({ url }: ShareLinkBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Lien copie. La bande peut etre rameutee.");
    } catch {
      setFeedback("Copie impossible ici. Selectionne le lien a l'ancienne.");
    }
  }

  return (
    <div className="share-box">
      <div>
        <p className="eyebrow">Lien unique</p>
        <p className="share-url">{url}</p>
      </div>
      <button className="button button--secondary" type="button" onClick={copyLink}>
        Copier le lien pour rameuter la bande
      </button>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
