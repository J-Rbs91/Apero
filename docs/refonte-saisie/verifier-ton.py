#!/usr/bin/env python3
"""Contrôle du cliquet anti-dérive de la routine « Refonte de la saisie ».

Recherche dans `src/` chacune des tournures gelées de TON.md et refuse de
sortir en 0 s'il en manque une. À lancer en Phase 0 (avant de modifier) et en
Phase 4 (avant de clore), depuis la racine du dépôt :

    python3 docs/refonte-saisie/verifier-ton.py

Deux normalisations sont indispensables, et c'est la raison d'être de ce
script plutôt que d'un `grep` réécrit à chaque itération :

- **l'apostrophe** — le code emploie l'apostrophe typographique « ’ » ; un
  `grep` sur l'apostrophe droite fait remonter faussement 14 tournures sur 25
  comme absentes, ce qui ressemble à s'y méprendre à une régression du corpus ;
- **les espaces** — B3 et B15 s'étendent sur plusieurs lignes JSX et ne
  tiennent sur aucune ligne unique.

Bibliothèque standard uniquement : ce dépôt n'installe rien pour se vérifier.

Ajouter une tournure au corpus n'est PAS une opération d'itération : elle
demande l'accord du propriétaire du produit (voir TON.md et DECISIONS.md).
Si ce fichier et TON.md divergent, c'est TON.md qui fait foi.
"""

import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parents[2] / "src"

# N₀ = 25. A8 et A9 sont chacune une paire de textes comptée pour une seule
# tournure (même paire, deux points d'appel) — voir TON.md § 3.
CORPUS: dict[str, str] = {
    "A1": "Tous tes créneaux sont déjà passés. Joli exploit temporel, zéro convive. La machine à remonter le temps est en réparation : vise l'avenir.",
    "A2": "La Confrérie est complète, archi-complète même : trop d'apéros tournent déjà en coulisses dans une magouille généralisée que plus personne ne maîtrise vraiment. Clôture un apéro avant d'en lancer un nouveau, sinon c'est le chaos total.",
    "A3": "Le service a fait une bêtise. On ne veut pas savoir laquelle. Deux secondes, ça se répare tout seul.",
    "A4": "Ce nom d'apéro est déjà pris par un événement en cours. Trouve-en un autre, ou laisse le champ vide pour un tirage au sort.",
    "A5": "Un apéro sans nom, ça ne se convoque pas. Garde l'ancien ou trouve mieux.",
    "A6": "Quitte à imposer cette contradiction, il s'agirait au moins d'avoir l'élégance d'être précis : un jour, une heure et un lieu, histoire que cette proposition ait meilleure mine que la tienne.",
    "A7": "Indique ton blaze, qu'on sache au moins l'intitulé du fauteur de troubles.",
    "A8a": "Marmaille admise",
    "A8b": "Ce soir c'est sans les mômes",
    "A9a": "En escadron",
    "A9b": "Peinard, en solo",
    "B1": "On verra bien après.",
    "B2": "La tablée tranchera.",
    "B3": "Une assemblée qui se répète devient un rituel : une fois celle-ci passée, la Confrérie proposera de convoquer la suivante dans la foulée, mêmes lieu et heure, date décalée d'autant.",
    "B4": "Date mystère",
    "B5": "Le registre se souvient de toi. Retouche, si le cœur t'en dit.",
    "B6": "Le registre est corrigé. On ne dira rien.",
    "B7": "C'est émargé. Le registre te remercie.",
    "B8": "L'envoi a raté. Ta réponse reste sous le coude, réessaie.",
    "B9": "Je viendrai si le monde ne s'est pas arrêté de tourner d'ici là.",
    "B10": "Pour que la tablée sache qui a bousculé le programme.",
    "B11": "Les mioches comptent dans le lot.",
    "B12": "C'est sans les mioches ce coup-ci : on parle de renforts en âge de trinquer.",
    "B13": "Le nombre de bouches en plus, qu'on prévoie assez de cacahuètes.",
    "B14": "Position refusée : pas de tournée du quartier sans ton feu vert. La recherche et la carte restent là.",
    "B15": "Aucun comptoir recensé à moins de 800 m. Soit le désert, soit une carte OpenStreetMap à compléter. La recherche reste là.",
    "B16": "Le rituel hebdomadaire.",
}

# Les paires qui ne comptent que pour une tournure dans N.
PAIRES = (("A8a", "A8b"), ("A9a", "A9b"))

N_ZERO = 25


def normaliser(texte: str) -> str:
    return re.sub(r"\s+", " ", texte.replace("’", "'").replace("‘", "'")).strip()


def main() -> int:
    if not SRC.is_dir():
        print(f"Introuvable : {SRC} — lancer ce script depuis le dépôt Apéro.")
        return 2

    fichiers = {
        chemin: normaliser(chemin.read_text(encoding="utf-8"))
        for chemin in SRC.rglob("*.ts*")
    }

    manquantes: list[str] = []
    for cle, texte in sorted(CORPUS.items()):
        aiguille = normaliser(texte)
        trouvee = sorted(
            str(chemin.relative_to(SRC.parent))
            for chemin, contenu in fichiers.items()
            if aiguille in contenu
        )
        if trouvee:
            print(f"OK      {cle:4} — {len(trouvee)} fichier(s) : {', '.join(trouvee)}")
        else:
            manquantes.append(cle)
            print(f"MANQUE  {cle:4} — « {texte[:70]}… »")

    presentes = sum(
        1 for cle in CORPUS if not cle.startswith(("A8", "A9")) and cle not in manquantes
    )
    presentes += sum(
        1 for paire in PAIRES if all(cle not in manquantes for cle in paire)
    )

    print(f"\nN = {presentes} / N₀ = {N_ZERO}")

    if manquantes:
        print(
            "\nRÉGRESSION DU CORPUS. Une tournure a disparu du code.\n"
            "La restaurer telle quelle est la première tâche de l'itération en cours,\n"
            "sauf accord explicite du propriétaire du produit consigné dans TON.md."
        )
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
