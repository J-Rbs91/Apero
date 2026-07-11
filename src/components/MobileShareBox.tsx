import { useState } from "react";

type MobileShareBoxProps = {
  url: string;
  title: string;
  text: string;
  /** Version affichée du lien (ex. lien d'invitation avec clés masquées). */
  displayUrl?: string;
  /**
   * Message secondaire de relance (ex. « Sonner le rappel » de l'organisateur) :
   * même lien, mais un texte qui récapitule l'état du registre pour aiguillonner
   * les retardataires.
   */
  reminder?: {
    label: string;
    title: string;
    text: string;
  };
};

export function MobileShareBox({ url, title, text, displayUrl, reminder }: MobileShareBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function copyMessage(message: string, successFeedback: string) {
    try {
      await navigator.clipboard.writeText(`${message}\n${url}`);
      setFeedback(successFeedback);
    } catch {
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  async function shareMessage(shareTitle: string, shareText: string, copyFeedback: string) {
    setFeedback("");

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (shareError) {
        // L’utilisateur a fermé la feuille de partage : on ne dit rien.
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          return;
        }
        // Sinon on retombe sur la copie.
      }
    }

    await copyMessage(shareText, copyFeedback);
  }

  async function handleShare() {
    await shareMessage(
      title,
      text,
      "Invitation copiée, mot pour mot. Colle-la dans ta conversation, le reste suivra tout seul.",
    );
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
      {reminder && (
        <button
          className="button button--ghost button--block"
          type="button"
          onClick={() =>
            shareMessage(
              reminder.title,
              reminder.text,
              "Rappel copié, mot pour mot. Colle-le dans la conversation, les retardataires comprendront.",
            )
          }
        >
          {reminder.label}
        </button>
      )}
      <div className="share">
        <code>{displayUrl ?? url}</code>
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
