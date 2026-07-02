# Audit post-purge - securite Apero

Etat apres correction sur la branche `API`.

## Conclusion

Aucun secret GitHub ne doit etre expose dans le frontend.

- Le workflow GitHub Pages n'injecte plus de secret dans le build Vite.
- La configuration frontend ne lit plus de token GitHub.
- L'ancien stockage GitHub direct du navigateur a ete supprime.
- Les ecritures GitHub directes depuis le navigateur sont desactivees.
- Le mode frontend par defaut est `api-vps`.
- Le token GitHub attendu par la mini API reste cote serveur uniquement.

## Donnees publiques

Les anciens fichiers JSON clairs d'apero et de recompenses ont ete retires du depot.

Le nouveau dossier cible est `data/aperos/`. Les fichiers qui y seront crees par l'API doivent rester chiffres : le repo public ne doit contenir ni donnees d'apero en clair, ni cle d'ecriture, ni cle de dechiffrement.

## Points a verifier au deploiement

1. Supprimer ou ignorer le secret GitHub Actions historique utilise par l'ancien frontend.
2. Configurer le token uniquement dans l'environnement VPS.
3. Configurer le mode API VPS et l'URL publique de l'API dans le build frontend.
4. Rebuilder GitHub Pages pour que l'ancien bundle public soit remplace.
5. Revoquer ou rotater tout token qui aurait deja ete expose avant cette correction.

## Controle attendu

La recherche dans le code applicatif ne doit trouver aucun usage frontend de token GitHub. Les seules occurrences d'authentification GitHub doivent rester dans `server/`, ou le code tourne cote serveur.