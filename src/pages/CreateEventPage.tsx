import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useAppNavigation } from "../routes/useAppNavigation";
import { LocationField } from "../components/LocationField";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import {
  ActionBar,
  ChoiceGroup,
  Disclosure,
  FormSection,
  SwitchRow,
  TextField,
  type ChoiceOption,
} from "../components/ui";
import { getAperoStorageMode } from "../config/aperoApiConfig";
import { eventStorage } from "../services";
import { AperoApiError } from "../services/aperoApiClient";
import {
  clearCreateEventDraft,
  readCreateEventDraft,
  saveCreateEventDraft,
} from "../services/createEventDraft";
import { createEncryptedApero } from "../services/encryptedAperoRepository";
import { addAperoToTablee } from "../services/tableeRepository";
import { useComptoirName } from "../hooks/useComptoirName";
import { useShakeInvalid } from "../hooks/useShakeInvalid";
import type {
  AperitifEvent,
  AperitifOption,
  AperoRecurrence,
  ParticipantResponse,
  VoteStatus,
} from "../types/apero";
import { AperoValidationError } from "../utils/aperoValidation";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess } from "../utils/haptics";
import type { CreateEventPrefill } from "../utils/nextRound";
import {
  generateUniqueCeremonialName,
  isCeremonialNameTaken,
  pickRandomCeremonialName,
} from "../utils/generateCeremonialName";
import { buildInvitePath } from "../utils/inviteLink";

type RecurrenceChoice = AperoRecurrence | "once";

/** Identifiant du bloc « message d'erreur » auprès de `useShakeInvalid`. Aucun
 *  créneau ne peut le porter : les identifiants de créneau viennent tous de
 *  `createId("option")`. */
const FEEDBACK_NODE_ID = "feedback";

/** Le brouillon s'écrit après une accalmie de frappe, pas à chaque caractère :
 *  `localStorage` est synchrone, et une écriture par touche se sent sur un
 *  téléphone d'entrée de gamme. */
const DRAFT_SAVE_DEBOUNCE_MS = 400;

const recurrenceChoices: ChoiceOption<RecurrenceChoice>[] = [
  { value: "once", label: "Une fois" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "biweekly", label: "Bimensuel" },
  { value: "monthly", label: "Mensuel" },
];

function createEmptyOption(): AperitifOption {
  return {
    id: createId("option"),
    date: "",
    time: "",
    location: "",
  };
}

/** Ce qui manque dans un créneau, champ par champ. */
function missingFieldsOf(option: AperitifOption): Array<"date" | "time" | "location"> {
  const missing: Array<"date" | "time" | "location"> = [];
  if (!option.date.trim()) {
    missing.push("date");
  }
  if (!option.time.trim()) {
    missing.push("time");
  }
  if (!option.location.trim()) {
    missing.push("location");
  }
  return missing;
}

export function CreateEventPage() {
  const { aller } = useAppNavigation();
  const location = useLocation();
  const { comptoirName } = useComptoirName();

  // Pré-remplissage « Remettre ça » / tournée récurrente : lieu, heure et
  // cadence de l'assemblée écoulée, transmis par la page d'invitation.
  const navigationState = location.state as {
    prefill?: CreateEventPrefill;
    // « Convoquer la tablée » : l'apéro créé rejoint d'office ses annales.
    linkToTablee?: { tableeId: string; encryptionKey?: string; writeKey?: string };
  } | null;
  const prefill = navigationState?.prefill;
  const linkToTablee = navigationState?.linkToTablee;

  // Brouillon relu une seule fois, au montage. Arriver par « Remettre ça »
  // (prefill) est une intention explicite et récente : elle passe devant un
  // brouillon dormant, qui reste en réserve tant qu'aucun apéro n'est créé.
  const [restoredDraft] = useState(() => (prefill ? null : readCreateEventDraft()));
  const [isDraftRestored, setIsDraftRestored] = useState(() => Boolean(restoredDraft));

  const [ceremonialNameInput, setCeremonialNameInput] = useState(
    prefill?.ceremonialName ?? restoredDraft?.ceremonialName ?? "",
  );
  const [title, setTitle] = useState(prefill?.title ?? restoredDraft?.title ?? "");
  const [childrenAllowed, setChildrenAllowed] = useState(
    prefill?.childrenAllowed ?? restoredDraft?.childrenAllowed ?? false,
  );
  const [recurrence, setRecurrence] = useState<RecurrenceChoice>(
    prefill?.recurrence ?? restoredDraft?.recurrence ?? "once",
  );
  const [options, setOptions] = useState<AperitifOption[]>(() => {
    if (prefill?.options?.length) {
      return prefill.options.map((option) => ({ ...option, id: createId("option") }));
    }
    return restoredDraft?.options?.length ? restoredDraft.options : [createEmptyOption()];
  });
  const [feedback, setFeedback] = useState("");
  // Tant qu'on n'a pas tenté d'envoyer, rien n'est souligné en rouge : la
  // barre du bas se contente d'annoncer ce qui reste à remplir.
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Verrou synchrone : disabled={isSubmitting} ne protège pas deux clics
  // dispatchés dans la même tâche JS (avant que React ne commit l'état),
  // qui créeraient deux apéros identiques.
  const submitLockRef = useRef(false);
  // Renvoie le regard sur le créneau incomplet — ou, quand le refus ne vise
  // aucun champ en particulier, sur le message qui l'explique.
  const { registerNode, shake, bringIntoView, shakingId } = useShakeInvalid();

  // Sauvegarde continue : la saisie survit à un rechargement, à un appel
  // entrant, à une bascule d'application. Elle n'est effacée qu'une fois
  // l'apéro réellement créé, ou sur demande explicite.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveCreateEventDraft({ ceremonialName: ceremonialNameInput, title, childrenAllowed, recurrence, options });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [ceremonialNameInput, title, childrenAllowed, recurrence, options]);

  /** Porte de sortie du brouillon restauré : une saisie qu'on ne peut pas
   *  vider est pire que pas de restauration du tout. */
  function startFromScratch() {
    clearCreateEventDraft();
    setCeremonialNameInput("");
    setTitle("");
    setChildrenAllowed(false);
    setRecurrence("once");
    setOptions([createEmptyOption()]);
    setFeedback("");
    setHasTriedSubmit(false);
    setIsDraftRestored(false);
  }

  function updateOption(optionId: string, updates: Partial<AperitifOption>) {
    setOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId ? { ...option, ...updates } : option,
      ),
    );
  }

  function removeOption(optionId: string) {
    setOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId),
    );
  }

  const completeOptions = options.filter((option) => missingFieldsOf(option).length === 0);
  const incompleteCount = options.length - completeOptions.length;
  const isReady = completeOptions.length > 0 && incompleteCount === 0;
  const firstIncompleteIndex = options.findIndex((option) => missingFieldsOf(option).length > 0);

  // La barre du bas parle toujours de la prochaine chose à faire, jamais en
  // langage de validation.
  //
  // Un refus vient d'être opposé : la barre est le seul élément que le pouce a
  // sous les yeux, elle ne peut pas continuer d'annoncer que tout est prêt.
  // Elle renvoie au message, qui vient d'être ramené dans le champ de vision.
  const actionStatus = feedback
    ? "Envoi refusé."
    : isReady
      ? completeOptions.length > 1
        ? `${completeOptions.length} créneaux prêts.`
        : "Prêt."
      : incompleteCount === 1
        ? `Créneau ${firstIncompleteIndex + 1} incomplet.`
        : `${incompleteCount} créneaux incomplets.`;

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitLockRef.current) {
      return;
    }
    setFeedback("");
    setHasTriedSubmit(true);

    const cleanedOptions = options
      .map((option) => ({
        ...option,
        date: option.date.trim(),
        time: option.time.trim(),
        location: option.location.trim(),
      }))
      .filter((option) => option.date || option.time || option.location);

    if (
      cleanedOptions.length === 0 ||
      cleanedOptions.some((option) => !option.date || !option.time || !option.location)
    ) {
      // Pas de laïus en pied de page : on remonte sur le créneau fautif, il
      // passe au rouge, il tremble, et le premier champ vide prend le focus.
      hapticError();
      const firstIncomplete = options.find((option) => missingFieldsOf(option).length > 0);
      if (firstIncomplete) {
        shake(firstIncomplete.id);
      }
      return;
    }

    const now = Date.now();
    const hasFutureSlot = cleanedOptions.some((option) => {
      const slotTime = new Date(`${option.date}T${option.time}:00`).getTime();
      return !Number.isNaN(slotTime) && slotTime > now;
    });

    if (!hasFutureSlot) {
      // Aucun champ n'est fautif — les créneaux sont complets, ils sont juste
      // passés. Le bloc à montrer est donc le message, pas un champ.
      hapticError();
      setFeedback("Date passée.");
      bringIntoView(FEEDBACK_NODE_ID);
      return;
    }

    try {
      submitLockRef.current = true;
      setIsSubmitting(true);
      const storageMode = getAperoStorageMode();
      // Mode api-vps : les apéros sont chiffrés, impossible de lister
      // l'existant pour garantir un nom unique.
      const activeEvents =
        storageMode === "api-vps" ? [] : await eventStorage.listActiveEvents();
      const trimmedCeremonialName = ceremonialNameInput.trim();

      if (trimmedCeremonialName && storageMode !== "api-vps" && isCeremonialNameTaken(trimmedCeremonialName, activeEvents)) {
        hapticError();
        setFeedback("Nom déjà pris.");
        bringIntoView(FEEDBACK_NODE_ID);
        return;
      }

      const ceremonialName = trimmedCeremonialName
        ? trimmedCeremonialName
        : storageMode === "api-vps"
          ? pickRandomCeremonialName()
          : generateUniqueCeremonialName(activeEvents);
      const nowIso = new Date().toISOString();
      const trimmedOrganizerName = comptoirName.trim();
      const savedRecurrence = recurrence === "once" ? undefined : recurrence;

      // L'organisateur est compté présent par défaut sur tous ses créneaux.
      const organizerVotes: Record<string, VoteStatus> = {};
      cleanedOptions.forEach((option) => {
        organizerVotes[option.id] = "yes";
      });
      const organizerParticipant: ParticipantResponse = {
        id: createId("participant"),
        participantName: trimmedOrganizerName,
        votes: organizerVotes,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (storageMode === "api-vps") {
        // Nouveau flux : chiffrement côté client puis écriture via l'API VPS.
        // L'aperoId et les clés sont générés par le repository ; le lien
        // d'invitation (avec clés en fragment) devient la seule porte d'entrée.
        const created = await createEncryptedApero({
          ceremonialName,
          title: title.trim() || undefined,
          organizerName: trimmedOrganizerName,
          beaufLevel: "medium",
          status: "active",
          childrenAllowed,
          recurrence: savedRecurrence,
          options: cleanedOptions.map((option) => ({
            ...option,
            createdByRole: "organizer",
            createdByName: trimmedOrganizerName,
            createdAt: nowIso,
          })),
          participants: [organizerParticipant],
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        // Convocation depuis une tablée : on grave l'apéro à ses annales.
        // Meilleur effort — un échec ici ne doit pas gâcher la création.
        if (linkToTablee?.writeKey && linkToTablee.encryptionKey) {
          try {
            await addAperoToTablee(
              linkToTablee.tableeId,
              linkToTablee.writeKey,
              linkToTablee.encryptionKey,
              {
                aperoId: created.aperoId,
                encryptionKey: created.encryptionKey,
                writeKey: created.writeKey,
                ceremonialName,
                addedBy: trimmedOrganizerName || undefined,
              },
            );
          } catch {
            // L'apéro existe et reste rattachable plus tard depuis sa page.
          }
        }

        hapticSuccess();
        // L'apéro existe : le brouillon n'a plus rien à protéger.
        clearCreateEventDraft();
        /* Fin de tunnel : l'apéro créé est au même niveau que le formulaire, la
           navigation REMPLACE donc son entrée. Un appui sur retour ramène d'où
           l'on venait, et ne rouvre pas un parcours terminé. */
        aller(
          buildInvitePath(created.aperoId, {
            encryptionKey: created.encryptionKey,
            writeKey: created.writeKey,
          }),
          { state: { createdEvent: created.event } },
        );
        return;
      }

      const event: AperitifEvent = {
        id: createId("apero"),
        ceremonialName,
        title: title.trim() || undefined,
        organizerName: trimmedOrganizerName,
        beaufLevel: "medium",
        status: "active",
        childrenAllowed,
        recurrence: savedRecurrence,
        options: cleanedOptions.map((option) => ({
          ...option,
          createdByRole: "organizer",
          createdByName: trimmedOrganizerName,
          createdAt: nowIso,
        })),
        participants: [organizerParticipant],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await eventStorage.createEvent(event);
      hapticSuccess();
      clearCreateEventDraft();
      aller(`/event/${event.id}`, { state: { createdEvent: event } });
    } catch (error) {
      hapticError();
      setFeedback(
        error instanceof AperoApiError && error.code === "API_NOT_CONFIGURED"
          ? "Service non configuré."
          : error instanceof AperoApiError && error.code === "NETWORK_ERROR"
            ? "Réseau indisponible. Réessayer."
            : error instanceof Error && error.message === "NO_CEREMONIAL_NAME_AVAILABLE"
              ? "Aucun nom libre. Saisir un nom."
              : error instanceof AperoValidationError
                ? "Saisie invalide. Vérifier les champs."
                : error instanceof Error
                  ? error.message
                  : "Création impossible. Réessayer.",
      );
      bringIntoView(FEEDBACK_NODE_ID);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <MobilePage
      className="create-mobile"
      header={<MobileHeader eyebrow="Apéro" />}
      hero={
        <div className="page-hero">
          <h1 className="h1 h1--sm">Nouvel apéro</h1>
        </div>
      }
    >
      <form className="sheet" onSubmit={handleSubmit}>

        {isDraftRestored && (
          // Accusé de réception à l'entrée, hors de la ligne de regard de la
          // saisie et hors du chemin du pouce : il se lit une fois, puis il
          // s'oublie. Il ne s'affiche que sur un brouillon réellement relu,
          // jamais sur la foi d'une sauvegarde supposée.
          <div className="draft-resume" role="status">
            <p className="feedback feedback--info">Brouillon restauré.</p>
            <button type="button" className="ghost-link" onClick={startFromScratch}>
              Recommencer
            </button>
          </div>
        )}

        <FormSection
          step={1}
          title="Créneaux"
          status={`${completeOptions.length}/${options.length}`}
          isDone={isReady}
        >
          <div className="slot-stack">
            {options.map((option, index) => {
              const missing = missingFieldsOf(option);
              const showErrors = hasTriedSubmit && missing.length > 0;

              return (
                <div
                  ref={registerNode(option.id)}
                  className={[
                    "slot slot--editable",
                    missing.length > 0 ? (showErrors ? "slot--error" : "slot--incomplete") : "",
                    shakingId === option.id ? "is-shaking" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={option.id}
                >
                  <div className="slot__top">
                    <span className="slot__no">
                      Créneau {index + 1}
                      <span
                        className={`slot__state slot__state--${missing.length === 0 ? "done" : "todo"}`}
                      >
                        {missing.length === 0 ? "Complet" : "Incomplet"}
                      </span>
                    </span>
                    {options.length > 1 && (
                      <button
                        type="button"
                        className="slot__x"
                        aria-label={`Retirer le créneau ${index + 1}`}
                        onClick={() => removeOption(option.id)}
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  <div className="slot__fields">
                    {/* Pas de pastille « Requis » sur chacun des trois :
                        le bloc le dit une fois, la carte porte son état, et
                        l'erreur tombe sous le champ concerné à l'envoi. */}
                    <TextField
                      label="Date"
                      type="date"
                      value={option.date}
                      error={showErrors && missing.includes("date") ? "Date requise." : undefined}
                      onChange={(value) => updateOption(option.id, { date: value })}
                    />
                    <TextField
                      label="Heure"
                      type="time"
                      value={option.time}
                      error={showErrors && missing.includes("time") ? "Heure requise." : undefined}
                      onChange={(value) => updateOption(option.id, { time: value })}
                    />
                    <LocationField
                      label="Lieu"
                      error={showErrors && missing.includes("location") ? "Lieu requis." : undefined}
                      value={{
                        location: option.location,
                        locationAddress: option.locationAddress,
                        locationLat: option.locationLat,
                        locationLng: option.locationLng,
                        locationPlaceId: option.locationPlaceId,
                      }}
                      onChange={(locationValue) => updateOption(option.id, locationValue)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="addline"
            onClick={() => setOptions((currentOptions) => [...currentOptions, createEmptyOption()])}
          >
            + Créneau
          </button>
        </FormSection>

        <FormSection step={2} title="Détails">
          <TextField
            label="Nom"
            requirement="optional"
            value={ceremonialNameInput}
            maxLength={160}
            onChange={setCeremonialNameInput}
          />
          <TextField
            label="Objet"
            requirement="optional"
            value={title}
            maxLength={160}
            onChange={setTitle}
          />
        </FormSection>

        <Disclosure title="Réglages" summary="Enfants, récurrence">
          <SwitchRow
            title="Enfants"
            state={childrenAllowed ? "Oui" : "Non"}
            checked={childrenAllowed}
            onChange={setChildrenAllowed}
          />

          <ChoiceGroup
            name="recurrence"
            legend="Récurrence"
            requirement="optional"
            options={recurrenceChoices}
            value={recurrence}
            onChange={setRecurrence}
          />
        </Disclosure>

        {feedback && (
          // Enregistré auprès de `useShakeInvalid` : sur un formulaire plus
          // long que l'écran, ce message se rendait sous le pli et personne
          // ne le voyait. Il est maintenant ramené sous les yeux au moment du
          // refus (DECISIONS.md D6).
          <p className="feedback" role="alert" ref={registerNode(FEEDBACK_NODE_ID)}>
            {feedback}
          </p>
        )}

        <ActionBar
          status={actionStatus}
          tone={feedback ? "blocked" : isReady ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
        >
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création" : "Créer"}
          </button>
        </ActionBar>
      </form>
    </MobilePage>
  );
}
