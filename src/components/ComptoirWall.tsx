import { useState } from "react";
import type { AperoMessage } from "../types/apero";
import { hapticError, hapticTap } from "../utils/haptics";

// Le mur du comptoir : les mots lâchés par la tablée autour de l'apéro.
// Pas une messagerie — un fil court, signé au blaze, gravé dans le payload
// chiffré de l'apéro comme le reste.

type ComptoirWallProps = {
  messages: AperoMessage[];
  /** Blaze du convive courant. Vide = lecture seule (pas encore de blaze). */
  authorName: string;
  /** Absent = lien en lecture seule : le mur s'affiche sans champ de saisie. */
  onPost?: (body: string) => Promise<void>;
  isSaving?: boolean;
};

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) {
    return "à l’instant";
  }
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `il y a ${diffHours} h`;
  }
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function ComptoirWall({ messages, authorName, onPost, isSaving }: ComptoirWallProps) {
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");

  const canPost = Boolean(onPost && authorName.trim());

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const body = draft.trim();

    if (!body || !onPost) {
      return;
    }

    try {
      setFeedback("");
      await onPost(body);
      hapticTap();
      setDraft("");
    } catch {
      hapticError();
      setFeedback("Le mot n’est pas arrivé jusqu’au mur. Réessaie dans un instant.");
    }
  }

  return (
    <section className="sheet">
      <p className="eyebrow">Le mur du comptoir</p>
      {messages.length === 0 ? (
        <p className="lede">
          Personne n’a encore rien lâché. Le premier mot donne toujours le ton de la
          soirée — à toi de voir lequel.
        </p>
      ) : (
        <div className="wall-list">
          {messages.map((message) => (
            <div className="wall-item" key={message.id}>
              <div className="wall-item__head">
                <span className="wall-item__author">{message.authorName}</span>
                <span className="wall-item__when">{formatWhen(message.createdAt)}</span>
              </div>
              <p className="wall-item__body">{message.body}</p>
            </div>
          ))}
        </div>
      )}

      {onPost && (
        <form className="wall-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Lâcher un mot{authorName.trim() ? ` (signé ${authorName.trim()})` : ""}</span>
            <textarea
              value={draft}
              onChange={(eventChange) => setDraft(eventChange.target.value)}
              rows={2}
              maxLength={500}
              placeholder="J’amène les olives, quelqu’un gère la glace ?"
              disabled={!canPost || isSaving}
            />
          </label>
          {!authorName.trim() && (
            <p className="hint">Choisis d’abord ton blaze (menu de la Confrérie) pour signer tes mots.</p>
          )}
          <button
            className="button button--ghost button--block"
            type="submit"
            disabled={!canPost || isSaving || !draft.trim()}
          >
            {isSaving ? "On grave le mot…" : "Poser ça sur le mur"}
          </button>
          {feedback && (
            <p className="feedback" role="alert">
              {feedback}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
