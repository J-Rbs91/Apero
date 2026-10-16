import { useRef, useState } from "react";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { Field } from "../components/ui";
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

// Succès et erreurs partagent le même emplacement mais pas la même urgence :
// la tonalité pilote le role ARIA (alert pour les erreurs, status sinon).
type Feedback = { tone: "ok" | "error"; text: string } | null;

export function CoffrePage() {
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportFeedback, setExportFeedback] = useState<Feedback>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFeedback, setImportFeedback] = useState<Feedback>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExportFeedback(null);

    if (exportPassphrase.length < MIN_PASSPHRASE_LENGTH) {
      setExportFeedback({
        tone: "error",
        text: `Mot de passe : ${MIN_PASSPHRASE_LENGTH} caractères minimum.`,
      });
      return;
    }

    try {
      setIsExporting(true);
      const payload = collectVaultPayload();

      if (payload.aperos.length === 0 && !payload.comptoirName) {
        setExportFeedback({
          tone: "error",
          text: "Rien à exporter.",
        });
        return;
      }

      const vault = await encryptVault(payload, exportPassphrase);
      const blob = new Blob([JSON.stringify(vault, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "sauvegarde-confrerie.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setExportPassphrase("");
      setExportFeedback({
        tone: "ok",
        text: "Sauvegarde exportée.",
      });
    } catch {
      setExportFeedback({
        tone: "error",
        text: "Export impossible. Réessayer.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    setImportFeedback(null);
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setImportFeedback({ tone: "error", text: "Fichier requis." });
      return;
    }
    if (!importPassphrase) {
      setImportFeedback({ tone: "error", text: "Mot de passe requis." });
      return;
    }

    // Un coffre légitime pèse quelques dizaines de kilo-octets : au-delà de
    // 5 Mo, c'est un fichier forgé ou une erreur de manipulation.
    if (file.size > 5 * 1024 * 1024) {
      setImportFeedback({
        tone: "error",
        text: "Fichier trop lourd, 5 Mo maximum.",
      });
      return;
    }

    try {
      setIsImporting(true);
      const rawText = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new VaultError("INVALID_FILE", "Fichier invalide.");
      }

      const payload = await decryptVault(parsed, importPassphrase);
      const result = mergeVaultPayload(payload);

      setImportPassphrase("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setImportFeedback({
        tone: "ok",
        text:
          `${result.importedAperoCount} apéro${result.importedAperoCount > 1 ? "s" : ""} importé${result.importedAperoCount > 1 ? "s" : ""}.` +
          (result.importedComptoirName ? " Nom importé." : ""),
      });
    } catch (importError) {
      setImportFeedback({
        tone: "error",
        text:
          importError instanceof VaultError
            ? importError.message
            : "Import impossible. Réessayer.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <MobilePage
      className="agenda-mobile"
      header={<MobileHeader eyebrow="La Confrérie" />}
      hero={
        <div className="page-hero">
          <h1 className="h1 h1--sm">Sauvegarde</h1>
        </div>
      }
    >
      <section className="sheet">
        <p className="eyebrow">Exporter</p>
        <Field
          label="Mot de passe"
          requirement="required"
          hint="Irrécupérable si oublié."
        >
          {(control) => (
            <input
              {...control}
              type="password"
              value={exportPassphrase}
              onChange={(eventChange) => setExportPassphrase(eventChange.target.value)}
              autoComplete="new-password"
            />
          )}
        </Field>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "Export en cours" : "Exporter"}
        </button>
        {exportFeedback && (
          <p
            className={`feedback${exportFeedback.tone === "ok" ? " feedback--ok" : ""}`}
            role={exportFeedback.tone === "error" ? "alert" : "status"}
          >
            {exportFeedback.text}
          </p>
        )}
      </section>

      <section className="sheet">
        <p className="eyebrow">Importer</p>
        <p className="hint">Fusion avec les données existantes.</p>
        <Field label="Fichier" requirement="required">
          {(control) => (
            <input {...control} ref={fileInputRef} type="file" accept="application/json,.json" />
          )}
        </Field>
        <Field label="Mot de passe" requirement="required">
          {(control) => (
            <input
              {...control}
              type="password"
              value={importPassphrase}
              onChange={(eventChange) => setImportPassphrase(eventChange.target.value)}
              autoComplete="off"
            />
          )}
        </Field>
        <button
          type="button"
          className="button button--ghost button--block"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? "Import en cours" : "Importer"}
        </button>
        {importFeedback && (
          <p
            className={`feedback${importFeedback.tone === "ok" ? " feedback--ok" : ""}`}
            role={importFeedback.tone === "error" ? "alert" : "status"}
          >
            {importFeedback.text}
          </p>
        )}
      </section>
    </MobilePage>
  );
}
