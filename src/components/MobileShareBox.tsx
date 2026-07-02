import { useState } from "react";

type MobileShareBoxProps = {
  url: string;
  title: string;
  text: string;
};

export function MobileShareBox({ url, title, text }: MobileShareBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function copyFullInvitation() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setFeedback("Invitation copiée, mot pour mot. Colle-la dans ta conversation, le reste suivra tout seul.");
    } catch {
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  async function handleShare() {
    setFeedback("");

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (shareError) {
        // L’utilisateur a fermé la feuille de partage : on ne dit rien.
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          return;
        }
        // Sinon on retombe sur la copie.
      }
    }

    await copyFullInvitation();
  }

  async function handleCopyLink() {
    setFeedback("");
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Lien copié.");
    } catch {
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  return (
    <div className="share-box">
      <p className="eyebrow">Rameuter le comptoir</p>
      <button className="button button--primary button--block" type="button" onClick={handleShare}>
        Partager l’invitation
      </button>
      <div className="share">
        <code>{url}</code>
        <button className="cp" type="button" onClick={handleCopyLink}>
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
