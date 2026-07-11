// Partage d'une image générée : feuille de partage native quand elle accepte
// les fichiers, téléchargement sinon.

export type ImageShareOutcome = "shared" | "downloaded" | "failed";

export async function shareOrDownloadPng(
  blob: Blob | null,
  fileName: string,
): Promise<ImageShareOutcome> {
  if (!blob || typeof document === "undefined") {
    return "failed";
  }

  const file = new File([blob], fileName, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return "shared";
      }
      // Feuille de partage indisponible : on retombe sur le téléchargement.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
