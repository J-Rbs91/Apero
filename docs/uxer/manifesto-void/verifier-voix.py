#!/usr/bin/env python3
"""Contrôle de la voix « Point Jaune » (minimalisme extrême).

Remplace `docs/refonte-saisie/verifier-ton.py`, dont le corpus d'humour de
comptoir a été retiré par décision du propriétaire (16/10/2026, voir
`UXER_VOICE.md`). Lancer depuis la racine du dépôt :

    python3 docs/uxer/manifesto-void/verifier-voix.py

Le script extrait de `src/` les textes susceptibles d'être affichés (texte JSX
et chaînes littérales qui ressemblent à du français), puis refuse :

- le point d'exclamation, le tiret cadratin et les emoji (charte V11) ;
- les mots retirés du lexique (charte §2) : blaze, troquet, rade, émarger,
  mioches, marmaille, mômes, traquenard, tablée, attabler, breloque, ardoise,
  carnet, zinc, coffre, convoquer, comptoir, registre, trinquer.

Bibliothèque standard uniquement. Sortie 0 si la voix tient, 1 sinon, avec la
liste des écarts (fichier:ligne). Les tests (`*.test.*`) sont ignorés : ils
peuvent citer d'anciens textes pour vérifier qu'ils ont disparu.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / "src"

BANNED = [
    r"blaze",
    r"troquets?",
    r"rades?",
    r"émarg\w*",
    r"mioches?",
    r"marmaille",
    r"mômes?",
    r"traquenard\w*",
    r"tablées?",
    r"attabl\w*",
    r"breloques?",
    r"ardoise",
    r"carnet",
    r"zinc",
    r"coffres?",
    r"convoqu\w*",
    r"comptoirs?",
    r"registres?",
    r"trinqu\w*",
]
BANNED_RX = re.compile(r"(?<![\w-])(" + "|".join(BANNED) + r")(?![\w-])", re.IGNORECASE)
EMOJI_RX = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
FRENCH_HINT = re.compile(r"[à-ÿÀ-ß]|\b[a-zA-Z]+ [a-zA-Z]+")

# Chaînes techniques à ne pas lire comme du texte affiché.
TECHNICAL = re.compile(r"^[\w./:#?&=%@-]*$|^\s*$|^(apero|tablee)_[\w-]+$")


def strip_comments(source: str) -> str:
    source = re.sub(r"\{/\*.*?\*/\}", lambda m: "\n" * m.group(0).count("\n"), source, flags=re.S)
    source = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), source, flags=re.S)
    return re.sub(r"(?<![:\"'`])//[^\n]*", "", source)


def visible_strings(source: str):
    """Rend (numéro de ligne, texte) pour chaque texte probablement affiché."""
    for match in re.finditer(r">([^<>{}]+)<", source):
        text = match.group(1).strip()
        # Une comparaison « a > b … c < d » dans du code n'est pas du JSX.
        if re.search(r";|\bconst\b|\breturn\b|&&|\|\||=", text):
            continue
        if text and re.search(r"[A-Za-zÀ-ÿ]", text):
            yield source.count("\n", 0, match.start()) + 1, text
    for match in re.finditer(r"([\"'`])((?:\\.|(?!\1).)*)\1", source):
        text = match.group(2)
        before = source[max(0, match.start() - 12) : match.start()]
        if "className" in before or "import" in before or "from" in before:
            continue
        if TECHNICAL.match(text) or not FRENCH_HINT.search(text):
            continue
        # Un gabarit qui enjambe du code (deux littéraux appariés à tort) n'est
        # pas un texte : on l'écarte plutôt que de signaler du code.
        if re.search(r"\bconst\b|\blet\b|=>|;\s*\n|\n\s*\n", text):
            continue
        yield source.count("\n", 0, match.start()) + 1, text


def main() -> int:
    problems: list[str] = []
    for path in sorted(SRC.rglob("*.ts*")):
        if ".test." in path.name or path.name.endswith(".d.ts"):
            continue
        source = strip_comments(path.read_text(encoding="utf-8"))
        for line, text in visible_strings(source):
            where = f"{path.relative_to(ROOT)}:{line}"
            if "!" in text and not re.search(r"!==?|!\w|\(!", text):
                problems.append(f"{where}  point d'exclamation  « {text[:60]} »")
            if "—" in text:
                problems.append(f"{where}  tiret cadratin  « {text[:60]} »")
            if EMOJI_RX.search(text):
                problems.append(f"{where}  emoji  « {text[:60]} »")
            banned = BANNED_RX.search(text)
            if banned:
                problems.append(f"{where}  mot retiré « {banned.group(1)} »  « {text[:60]} »")
    for problem in problems:
        print(problem)
    print(f"{len(problems)} écart(s) de voix.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
