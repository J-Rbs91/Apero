# Pistes de monétisation — La Confrérie du Petit Jaune

> Brainstorm honnête. On ne cherche pas *une idée qui rapporterait dans un monde
> parfait*, mais **ce qui est cohérent avec l'app telle qu'elle est**, réaliste à
> mettre en œuvre, et compatible avec ses valeurs. Chaque piste est notée sur trois
> axes : **Cohérence** (colle-t-elle à l'ADN ?), **Faisabilité** (peut-on la brancher
> sans casser l'architecture ?), **Revenu** (ordre de grandeur réaliste).

---

## 1. Cadrage : les 4 contraintes qui filtrent tout

Avant de rêver, voici ce qui rend **la plupart des modèles classiques inapplicables ici**.
Toute piste doit passer ces quatre filtres.

1. **Le zero-knowledge est sacré.** Le serveur ne voit que du ciphertext. Impossible de
   vendre de la data, de cibler de la pub côté serveur, ou de savoir qui va où. → **La pub
   comportementale et la revente de données sont mortes d'avance.** Ce n'est pas une
   faiblesse : c'est un argument de vente.
2. **Usage ponctuel et de courte durée.** On organise un apéro, on vote, c'est fini. Personne
   n'ouvre l'app tous les jours. → **Un abonnement mensuel grand public est un mur.** La valeur
   se capte *au moment* de l'événement, pas dans la durée.
3. **Audience de niche (pour l'instant petite).** Français, culture comptoir, ton absurde.
   → Les modèles qui exigent du volume massif (pub au CPM, freemium à faible conversion)
   ne paieront rien avant longtemps. Les modèles **à forte valeur unitaire** (affiliation,
   B2B, sponsoring) rapportent même à petite échelle.
4. **La vraie donnée de valeur, c'est le LIEU.** L'app existe pour répondre à *« on se retrouve
   OÙ ? »*. Le client (et lui seul) connaît le bar choisi. **C'est le seul actif réellement
   monétisable** — et il l'est **côté client**, donc sans casser le zero-knowledge.

**Conclusion de cadrage :** l'argent cohérent est autour de **la décision « où boire »** et de
**l'identité de marque apéro/pastis**. Le reste est secondaire.

---

## 2. Les pistes, classées

### 🥇 Piste A — Affiliation & partenariats établissements (LE cœur)

L'app aide un groupe à choisir *où* se retrouver. C'est exactement le moment où un bar/une
brasserie paierait pour être là.

- **Réservation affiliée.** Quand un créneau gagnant a un lieu identifié, afficher un bouton
  *« Réserver la table »* → lien affilié (TheFork/LaFourchette, Zenchef, etc.). Commission par
  réservation honorée. Se branche **côté client**, à partir des coordonnées déjà géocodées
  (Photon/OpenStreetMap) → **zero-knowledge intact**.
- **Établissements mis en avant dans l'autocomplétion.** Un bar partenaire apparaît en tête des
  suggestions de lieu dans sa zone (clairement signalé « partenaire »). Modèle : petit forfait
  mensuel par établissement, ou CPC.
- **Offre « la tournée du partenaire ».** Un bar propose un avantage aux tablées qui s'y donnent
  rendez-vous via l'app (planche offerte, happy hour prolongé). Code affiché sur la page de
  verdict.

| Cohérence | Faisabilité | Revenu |
|-----------|-------------|--------|
| ★★★★★ (c'est la fonction même de l'app) | ★★★☆☆ (dépend d'un réseau d'établissements ou d'un agrégateur) | ★★★★☆ (forte valeur unitaire, scale avec l'audience) |

**Point dur :** amorçage. L'affiliation via un agrégateur (TheFork) est branchable tout de suite
mais paie peu à petit trafic ; le démarchage direct de bars ne scale pas à la main. → Commencer
par **1–2 bars pilotes locaux** pour prouver la valeur, puis agrégateur pour le volume.

---

### 🥈 Piste B — Sponsoring de marque (l'identité est déjà là)

L'app s'appelle littéralement *« Le Petit Jaune »*, parle de *pastaga*. **L'univers de marque est
un cadeau** pour un annonceur du secteur (spiritueux, bières artisanales, apéritifs sans alcool,
softs, charcuterie/olives…).

- **Édition co-brandée / « propulsé par ».** *« La Confrérie du Petit Jaune, servie par
  [marque] »* — habillage discret, respectueux du ton. Sponsoring forfaitaire, pas au CPM.
- **Badges & Palmarès sponsorisés.** La brique gamification existe déjà (`PalmaresPage`, badges).
  Un badge collector « [Marque] » à débloquer, une saison thématique. Natif, non intrusif.
- **Attention réglementaire (loi Évin).** La promotion d'alcool est encadrée en France :
  privilégier les **marques sans alcool / softs / apéritifs sans alcool / food**, ou rester sur
  du sponsoring très sobre côté spiritueux. C'est une contrainte à respecter, pas un blocage.

| Cohérence | Faisabilité | Revenu |
|-----------|-------------|--------|
| ★★★★★ (l'ADN colle parfaitement) | ★★★★☆ (technique triviale ; le dur c'est décrocher le deal) | ★★★★☆ (un seul deal annuel peut couvrir les coûts et plus) |

**Point dur :** il faut une audience minimale (quelques milliers d'utilisateurs actifs) pour
intéresser une marque. → Piste à **activer une fois la traction prouvée**, pas au jour 1.

---

### 🥉 Piste C — B2B / usage « organisateur intensif »

Le grand public organise un apéro de temps en temps. Mais **certains coordonnent des groupes
sans arrêt** : BDE étudiants, associations, clubs sportifs (3ᵉ mi-temps), comités d'entreprise,
teams RH pour les afterworks. Pour eux, l'outil a une vraie valeur récurrente.

- **Espace « Confrérie » (multi-événements).** Un organisateur récurrent gère plusieurs assemblées,
  garde ses membres, voit l'historique. Forfait mensuel modeste (quelques €), justifié par la
  récurrence — là où le grand public ne paierait pas.
- **White-label léger.** Un bar/brasserie ou une asso propose *sa* version brandée pour animer sa
  communauté (soirées, événements). Setup + abonnement.
- **Fonctions pro :** plus de participants, événements récurrents, export (image du verdict, déjà
  listé dans les évolutions), QR code de convocation (déjà listé), rappels avancés.

| Cohérence | Faisabilité | Revenu |
|-----------|-------------|--------|
| ★★★★☆ | ★★★☆☆ (demande comptes/rôles → sort du modèle « lien anonyme ») | ★★★★☆ (ARR récurrent, la seule piste vraiment prévisible) |

**Point dur :** casse un peu le modèle actuel « pas de compte, juste un lien ». À réserver à un
segment pro assumé, sans dénaturer l'expérience grand public.

---

### Piste D — Freemium grand public (à manier avec prudence)

Le classique : le cœur reste gratuit, on facture des extras.

- **Gratuit :** créer/voter/verdict — tout l'essentiel. **Ne jamais toucher à ça**, c'est le
  moteur d'acquisition.
- **Payant (micro-paiement one-shot plutôt qu'abonnement) :** thèmes/habillages de convocation,
  export image HD du verdict, QR code personnalisé, « grande tablée » (au-delà de N invités),
  animation Lottie premium (la dépendance `lottie-web` est déjà là).

| Cohérence | Faisabilité | Revenu |
|-----------|-------------|--------|
| ★★★☆☆ | ★★★★☆ (technique simple) | ★★☆☆☆ (conversion faible sur usage ponctuel) |

**Verdict :** utile en **complément** (quelques % de marge, paiement à l'acte > abonnement), mais
**ne portera jamais le modèle à lui seul** vu la fréquence d'usage. À ne pas sur-investir.

---

### Piste E — Le « pot commun » / cagnotte (revenu marginal mais 100 % raccord)

Très aligné avec le ton (*« paie ta tournée »*), faible revenu, mais quasi gratuit à poser.

- **Bouton pourboire / soutien.** *« Offrir un canon au comptoir numérique »* pour financer le VPS.
  Don ponctuel (Ko-fi, Liberapay, Stripe payment link).
- **Cagnotte d'apéro intégrée.** Fonction utile : répartir la note / collecter la participation de
  la tablée avant l'événement (lien Lydia/cagnotte). Peut devenir **affiliation** (commission
  légère de la plateforme de cagnotte) — et rend un vrai service.

| Cohérence | Faisabilité | Revenu |
|-----------|-------------|--------|
| ★★★★★ (ton parfait) | ★★★★★ (un lien à poser) | ★★☆☆☆ (dons) → ★★★☆☆ (si cagnotte affiliée) |

---

## 3. À éviter (incohérent ou destructeur de valeur)

- **Pub display / réseaux CPM.** Rapporte des clopinettes à cette échelle, dégrade l'expérience,
  et **contredit frontalement le zero-knowledge** (trackers). ❌
- **Revente de données.** Techniquement impossible (chiffrement) *et* contraire à la promesse. ❌
- **Paywall sur le cœur (créer/voter).** Tuerait l'acquisition virale par lien partagé — le seul
  vrai moteur de croissance. ❌
- **Abonnement mensuel grand public.** Fréquence d'usage trop faible → churn immédiat. ❌

---

## 4. Recommandation : séquencement réaliste

On ne lance pas tout. On avance par paliers, chacun débloquant le suivant.

**Palier 0 — maintenant (coût ~0, pose les rails) :**
- Bouton **soutien/pourboire** (Piste E) pour financer le VPS et tester l'appétence à payer.
- Préparer le terrain **affiliation lieu** : le géocodage existe déjà, ajouter un point d'ancrage
  UI *« Réserver »* sur le verdict, même sans deal signé (lien générique TheFork pour commencer).

**Palier 1 — traction naissante (l'app a des utilisateurs récurrents) :**
- **Affiliation établissements** (Piste A) sérieusement : 1–2 bars pilotes locaux + agrégateur.
  C'est le cœur du modèle, à forte valeur unitaire, compatible zero-knowledge.
- **Cagnotte d'apéro** (Piste E, version affiliée) : service réel + petite commission.

**Palier 2 — audience prouvée (milliers d'actifs) :**
- **Sponsoring de marque** (Piste B), en priorité **sans alcool / food** pour la sérénité loi Évin.
  Un seul deal annuel peut basculer le projet dans le vert.
- **Offre B2B / organisateur intensif** (Piste C) pour un revenu récurrent prévisible.

**Fil rouge :** le grand public garde **tout le cœur gratuit, à vie**. On monétise le **moment de
décision (le lieu)**, **l'identité de marque**, et **les usages pro** — jamais l'acte de base de se
mettre d'accord pour trinquer.

---

### En une phrase

> La seule monétisation vraiment cohérente ici, c'est **de faire payer ceux qui veulent être *au
> bout* de la décision** (les bars où l'on va, les marques dont on parle, les organisateurs
> intensifs) — pas la tablée qui vote. Le zero-knowledge et le ton ne sont pas des freins : ce
> sont les deux choses qui rendent ces partenariats désirables.
