import { useRef, useState } from "react";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import {
  collectVaultPayload,
  decryptVault,
  encryptVault,
  mergeVaultPayload,
  VaultError,
} from "../services/registryVault";

// Le Coffre : emporter son blaze, ses clés et son historique d'un appareil à
// l'autre, dans un fichier chiffré par phrase de passe. Rien ne transite par
// un serveur : le fichier voyage comme le membre l'entend.

const MIN_PASSPHRASE_LENGTH = 8;

export function CoffrePage() {
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportFeedback, setExportFeedback] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFeedback, setImportFeedback] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExportFeedback("");

    if (exportPassphrase.length < MIN_PASSPHRASE_LENGTH) {
      setExportFeedback(
        `Il faut une phrase de passe d’au moins ${MIN_PASSPHRASE_LENGTH} caractères : c’est elle qui garde le coffre.`,
      );
      return;
    }

    try {
      setIsExporting(true);
      const payload = collectVaultPayload();

      if (payload.aperos.length === 0 && !payload.comptoirName) {
        setExportFeedback("Le coffre serait vide : rien à emporter sur cet appareil pour l’instant.");
        return;
      }

      const vault = await encryptVault(payload, exportPassphrase);
      const blob = new Blob([JSON.stringify(vault, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "coffre-confrerie.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setExportPassphrase("");
      setExportFeedback(
        `Coffre scellé et téléchargé : ${payload.aperos.length} apéro${payload.aperos.length > 1 ? "s" : ""} et ton blaze. Garde la phrase de passe précieusement, personne ne pourra la retrouver.`,
      );
    } catch {
      setExportFeedback("Le coffre a refusé de se sceller. Réessaie dans un instant.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    setImportFeedback("");
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setImportFeedback("Choisis d’abord le fichier de coffre à ouvrir.");
      return;
    }
    if (!importPassphrase) {
      setImportFeedback("Il faut la phrase de passe qui a scellé ce coffre.");
      return;
    }

    try {
      setIsImporting(true);
      const rawText = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new VaultError("INVALID_FILE", "Ce fichier n'est pas un coffre de la Confrérie.");
      }

      const payload = await decryptVault(parsed, importPassphrase);
      const result = mergeVaultPayload(payload);

      setImportPassphrase("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setImportFeedback(
        `Coffre ouvert : ${result.importedAperoCount} apéro${result.importedAperoCount > 1 ? "s" : ""} rapatrié${result.importedAperoCount > 1 ? "s" : ""} sur cet appareil` +
          (result.importedComptoirName ? `, blaze « ${result.importedComptoirName} » adopté` : "") +
          ". Tu retrouveras tout dans l’ardoise.",
      );
    } catch (importError) {
      setImportFeedback(
        importError instanceof VaultError
          ? importError.message
          : "Le coffre n’a pas voulu s’ouvrir. Réessaie dans un instant.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="Le Coffre de la Confrérie" />

      <section className="sheet">
        <h1 className="h1 h1--sm">Ton registre, sous clé</h1>
        <p className="lede">
          Ton blaze, tes apéros et leurs clés vivent uniquement sur cet appareil. Le Coffre
          les emballe dans un fichier chiffré par ta phrase de passe : change de téléphone,
          ouvre le coffre, et la Confrérie te reconnaît comme si de rien n’était.
        </p>
      </section>

      <section className="sheet">
        <p className="eyebrow">Sceller un coffre</p>
        <label className="field">
          <span>Phrase de passe (garde-la précieusement)</span>
          <input
            type="password"
            value={exportPassphrase}
            onChange={(eventChange) => setExportPassphrase(eventChange.target.value)}
            placeholder="Une phrase que toi seul connais"
            autoComplete="new-password"
          />
        </label>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "On scelle le coffre…" : "Sceller et télécharger le coffre"}
        </button>
        {exportFeedback && (
          <p className="feedback" role="status">
            {exportFeedback}
          </p>
        )}
      </section>

      <section className="sheet">
        <p className="eyebrow">Ouvrir un coffre</p>
        <p className="hint">
          Sur le nouvel appareil : choisis le fichier, saisis la phrase de passe, et tout
          fusionne avec l’existant — un apéro déjà connu ici garde son rôle d’organisateur.
        </p>
        <label className="field">
          <span>Fichier de coffre</span>
          <input ref={fileInputRef} type="file" accept="application/json,.json" />
        </label>
        <label className="field">
          <span>Phrase de passe</span>
          <input
            type="password"
            value={importPassphrase}
            onChange={(eventChange) => setImportPassphrase(eventChange.target.value)}
            placeholder="Celle qui a scellé le coffre"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="button button--ghost button--block"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? "On force la serrure… non, on déchiffre." : "Ouvrir le coffre sur cet appareil"}
        </button>
        {importFeedback && (
          <p className="feedback" role="status">
            {importFeedback}
          </p>
        )}
      </section>
    </MobilePage>
  );
}
