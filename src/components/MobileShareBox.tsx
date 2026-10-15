import { useState } from "react";
import { hapticError, hapticSuccess } from "../utils/haptics";

type MobileShareBoxProps = {
  url: string;
  title: string;
  text: string;
  /** Version affichée du lien (ex. lien d'invitation avec clés masquées). */
  displayUrl?: string;
  /**
   * Vrai quand rameuter EST le geste attendu sur cet écran : le bouton passe
   * alors en plein jaune. Ailleurs il reste en second plan, pour qu'un seul
   * bouton plein par écran indique quoi faire.
   */
  isPrimary?: boolean;
  /** Une phrase de contexte au-dessus des boutons. */
  lead?: string;
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

export function MobileShareBox({
  url,
  title,
  text,
  displayUrl,
  isPrimary = false,
  lead,
  reminder,
}: MobileShareBoxProps) {
  const [feedback, setFeedback] = useState("");

  async function copyMessage(message: string, successFeedback: string) {
    try {
      await navigator.clipboard.writeText(`${message}\n${url}`);
      hapticSuccess();
      setFeedback(successFeedback);
    } catch {
      hapticError();
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
      hapticSuccess();
      setFeedback("Lien copié.");
    } catch {
      hapticError();
      setFeedback("Copie impossible ici. Garde le lien sous le coude.");
    }
  }

  return (
    <section className={`sheet${isPrimary ? " sheet--hero" : ""}`}>
      <div>
        <p className="eyebrow">Rameuter le comptoir</p>
        {lead && <p className="lede">{lead}</p>}
      </div>

      <button
        className={`button ${isPrimary ? "button--primary" : "button--ghost"} button--block`}
        type="button"
        onClick={handleShare}
      >
        Partager l’invitation
      </button>

      {reminder && (
        <button
          className="button button--quiet button--block"
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
    </section>
  );
}
