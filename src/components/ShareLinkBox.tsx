import { useState } from "react";

type ShareLinkBoxProps = {
  url: string;
};

export function ShareLinkBox({ url }: ShareLinkBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Convocation copiée. Le peuple peut être rameuté.");
    } catch {
      setFeedback("Copie impossible ici. Sélectionne le lien comme un archiviste du zinc.");
    }
  }

  return (
    <div className="share-box">
      <div>
        <p className="eyebrow">Convocation officielle</p>
        <p className="share-url">{url}</p>
      </div>
      <button className="button button--secondary" type="button" onClick={copyLink}>
        Copier la convocation pour rameuter la bande
      </button>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
