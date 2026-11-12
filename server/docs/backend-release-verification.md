# Vérifier la publication du backend

Le service VPS exécute `server/dist/index.js` : actualiser uniquement les sources ou le site statique ne reconstruit pas cet artefact. Les tests et le build CI du backend ne prouvent pas qu'il est installé sur le VPS.

Avant une opération autorisée, identifier le commit cible, les paramètres effectifs, le backend de stockage et les dépendances ; conserver le build précédent et sa configuration pour retour arrière. Le backend récent prend aussi en charge SQLite : ne pas changer de stockage, déclencher de migration ou supposer que la configuration antérieure est compatible. Construire le commit choisi dans un répertoire de staging isolé, avec installation et build reproductibles, puis exécuter tests et contrôles du backend dans ce répertoire. Conserver l'association entre commit, artefact et date. La bascule du build et le redémarrage doivent être coordonnés selon la procédure autorisée du VPS.

Après bascule, vérifier la santé du service et sa version déployée par une attestation adaptée, ainsi que les parcours de lecture et d'écriture convenus. Ne pas provoquer de dépassement de quota en production. En cas d'échec, restaurer le build et la configuration précédents ensemble ; les compteurs mémoire repartent à zéro au redémarrage. Vérifier à nouveau le service après retour arrière.

La politique testée actuellement exclut `GET` du limiteur ciblé, tandis que `HEAD` y reste soumis ; le limiteur global s'applique toujours. Les lectures excessivement limitées par un ancien artefact peuvent provoquer des 429 prématurés. Cet impact potentiel doit être distingué d'un incident utilisateur effectivement observé.
