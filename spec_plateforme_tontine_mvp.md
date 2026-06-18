# Plateforme tontine — Spécifications fonctionnelles MVP

**Document de référence consolidé**
**Version 1.3**
**Date : 1er juin 2026**

---

## Table des matières

1. [Vision produit](#1-vision-produit)
2. [Acteurs et rôles](#2-acteurs-et-rôles)
3. [Identité et niveaux de vérification](#3-identité-et-niveaux-de-vérification)
4. [Module Wallet](#4-module-wallet)
5. [Module Tontines](#5-module-tontines)
6. [Module Cotisation Personnelle](#6-module-cotisation-personnelle)
7. [Module Prêts](#7-module-prêts)
8. [Module Litiges et réclamations](#8-module-litiges-et-réclamations)
9. [Méthodes de paiement](#9-méthodes-de-paiement)
10. [Notifications et communications](#10-notifications-et-communications)
11. [Back-office et système de grants](#11-back-office-et-système-de-grants)
12. [Sécurité et conformité](#12-sécurité-et-conformité)
13. [Roadmap post-MVP](#13-roadmap-post-mvp)
14. [Glossaire](#14-glossaire)

---

## 1. Vision produit

### 1.1 Nature de la plateforme

La plateforme est une **fintech à contrepartie centrale** opérant en zone UEMOA (Bénin et pays voisins). Elle ne fonctionne pas comme un réseau de groupes d'amis qui se cotisent entre eux, mais comme un **fournisseur de produits financiers** où la plateforme elle-même est la contrepartie de chaque opération.

Les utilisateurs sont **anonymes entre eux**. Ils ne choisissent pas qui rejoint leurs tontines, ne se connaissent pas, ne communiquent pas entre eux. La plateforme orchestre tout : collecte, redistribution, prêts, suivi.

### 1.2 Produits proposés au MVP

- **Tontines rotatives** : cagnotte par cycle, versée à un participant tiré au sort
- **Cotisation personnelle** : épargne individuelle en mode libre, programmé, bloqué ou avec objectif
- **Prêts** : crédits accordés par la trésorerie de la plateforme avec scoring interne
- **Wallet** : compte unique en XOF servant de support à toutes les opérations

### 1.3 Devise et zone

- **Devise unique au MVP : XOF** (Franc CFA UEMOA)
- Multi-devises (XAF, Naira, Yen, Rouble, Dollar, Euro) prévu en phase 2 avec conversion via API de change professionnelle

### 1.4 Principes directeurs

- **Sécurité maximale** : OTP pour tous les montants, double signature sur tout mouvement back-office, traçabilité immuable
- **Transparence totale** : pas de fonctionnalité cachée, frais affichés au coût réel, historique consultable à vie
- **Conformité réglementaire** : respect des règles anti-blanchiment, coopération avec les autorités, auditabilité complète
- **Anti-doublon par construction** : un CIP = un compte, à vie
- **Score de confiance interne** : chaque utilisateur a un score numérique qui évolue à chaque événement (cotisation à temps, défaut, dette recouvrée, désistement…). Outil d'aide à la décision pour l'admin (limite de tontines simultanées, éligibilité prêts futurs). Jamais affiché à l'utilisateur.

---

## 2. Acteurs et rôles

### 2.1 Côté utilisateur (front-office)

**Utilisateur** : personne physique unique identifiée par son CIP, possédant un compte plateforme avec un wallet en XOF.

Aucune sous-catégorie d'utilisateur au MVP. Tous ont les mêmes droits, modulés uniquement par leur niveau de vérification KYC.

### 2.2 Côté administration (back-office)

| Rôle | Mission principale | Grants associés |
|------|-------------------|-----------------|
| Agent vérification KYC | Examiner les dossiers d'inscription | `kyc.review` |
| Officier conformité | Auditer, geler, valider les niveaux 2 et 3 | `compliance.audit`, `compliance.freeze` |
| Agent support | Gérer les tickets utilisateurs niveau 1 | `support.read`, `support.ticket` |
| Trésorier plateforme | Exécuter mouvements de trésorerie | `treasury.execute` |
| Super-administrateur | Configurer la plateforme, attribuer les grants | `admin.grants`, `admin.config`, `admin.override` |
| Auditeur | Lecture seule, exports forensiques | `audit.readonly` |

### 2.3 Acteurs externes

- **État (Bénin) — émetteur du CIP** : la plateforme reçoit la photo de la carte CIP de l'utilisateur, un agent BO la vérifie manuellement (pas d'API officielle)
- **Agrégateur mobile money** : KKiapay, FedaPay ou PaySika selon choix final, gère l'interface unique avec MTN, Moov, Orange et Wave
- **Banque partenaire** : Ecobank, UBA ou similaire, pour les virements bancaires et le compte de cantonnement
- **Passerelle carte bancaire** : Stripe ou équivalent local, pour les paiements par Visa/Mastercard
- **Autorités compétentes** : police, BCEAO, GIABA — saisies par la plateforme dans les cas graves de fraude ou blanchiment

---

## 3. Identité et niveaux de vérification

### 3.1 Le CIP comme identifiant unique

Le **CIP** (Carte d'Identification Personnelle) est une carte physique nationale délivrée par l'État béninois, déjà utilisée par les banques et opérateurs mobile money. Chaque personne physique en possède une unique. La plateforme s'appuie sur ce dispositif pour garantir l'unicité des comptes.

**À l'inscription, l'utilisateur fournit :**
- Son numéro de CIP
- Une photo lisible de sa carte CIP

**Vérifications réalisées par la plateforme :**
- Contrôle anti-doublon : ce numéro CIP est-il déjà utilisé en base ?
- Vérification manuelle par un agent BO disposant du grant `kyc.review` : la photo est-elle lisible, le numéro cohérent avec la carte présentée ?

Le CIP est **obligatoire pour tous** les utilisateurs. Sans CIP, pas de compte du tout.

### 3.2 Les quatre niveaux de vérification

| Niveau | Conditions | Ce que ça débloque |
|--------|-----------|--------------------|
| **0** | Téléphone + OTP | Exploration, simulateur, consultation |
| **1** | CIP recto + verso + selfie + NPI, vérifiés par agent BO (seul **hard-gate**) | Recharger, cotiser tontine, recevoir cagnotte, retirer (plafonds modérés) |
| **2** | Revenus structurés : montant déclaré, source, statut professionnel, employeur, ancienneté, charges, personnes à charge + justificatifs | Plafonds élevés, scoring crédit interne activé |
| **3** | **Banque** (RIB / IBAN, titulaire) **et / ou Mobile Money** (MTN, Moov, Celtiis) **et / ou garant** (nom, téléphone, lien, adresse). Chaque sous-section est ajoutable indépendamment, dans l'ordre choisi par l'utilisateur. Validation manuelle officier conformité + super-admin (double signature) | Très gros montants, prêts importants, traitement de litiges complexes — expire après 6 mois sans usage |

**Règle d'or** : aucune action sensible ne descend d'un cran. Un retrait reste verrouillé au niveau 1 même si l'utilisateur a atteint le niveau 3.

**Limite de tontines simultanées** : à la validation du niveau 2 ou 3, l'admin fixe **manuellement** le nombre maximum de tontines auxquelles l'utilisateur peut participer en même temps (`max_tontines`). Cette décision tient compte du score de confiance, des revenus déclarés, du garant et des montants visés. Il n'y a pas de formule automatique.

**Niveaux 2 et 3 = optionnels et progressifs** : ils débloquent des plafonds et permissions supplémentaires, mais ne bloquent jamais l'usage de la plateforme. Seul le niveau 1 est un hard-gate.

---

## 4. Module Wallet

### 4.1 Structure

Un seul wallet par utilisateur, en XOF. Le solde se décompose en deux zones :

- **Solde disponible** : mobilisable par l'utilisateur (retrait, cotisation, remboursement)
- **Solde bloqué** : visible mais non mobilisable, détaillé par motif

**Solde total = Solde disponible + Solde bloqué**

### 4.2 Motifs de blocage

| Motif | Origine | Libération |
|-------|---------|-----------|
| Caution tontine | Souscription à une tontine | Clôture de la tontine si pas de pénalité subie |
| Pénalité retenue | Défaut de cotisation | Définitivement perdue |
| Gel litige | Décision officier conformité | Levée par décision finale BO |
| Gel prêt impayé | 1 échéance impayée | Levée après régularisation totale |
| Réservation échéance | 24h avant prélèvement automatique | Conversion en débit ou libération si annulation |
| Recharge en cours | Recharge non confirmée | Validation ou annulation sous 1 heure |

**Le wallet ne peut jamais aller en négatif.** Les sommes dues qu'on n'arrive pas à prélever ne basculent pas le solde sous zéro : elles vivent dans un **livre de dettes** dédié (cf. § 8.7 Recouvrement). Toute recharge ultérieure du wallet sert d'abord automatiquement à éteindre les dettes les plus anciennes (auto-débit) avant d'être disponible pour l'utilisateur.

Tant qu'une dette est ouverte sur un compte :
- Le **retrait** est refusé (l'utilisateur doit régler avant de retirer)
- L'**inscription à une nouvelle tontine** est refusée
- Le **dépôt** reste autorisé (c'est ce qui permet de solder la dette)

### 4.3 Opérations disponibles

**Entrées (créditent le wallet)**
- Recharge depuis mobile money, virement, ou carte bancaire
- Cagnotte gagnée à un tirage de tontine
- Déblocage de fonds suite à octroi de prêt
- Restitution de caution à clôture de tontine
- Régularisation suite à litige tranché en faveur de l'utilisateur

**Sorties (débitent le wallet)**
- Retrait vers mobile money
- Cotisation à une tontine (prélèvement automatique à l'échéance)
- Remboursement d'échéance de prêt
- Pénalités prélevées sur caution
- **Règlement de dette** (auto-débit déclenché par toute recharge tant qu'une dette est ouverte)

**Mouvements internes (entre disponible et bloqué)**
- Blocage caution à la souscription d'une tontine
- Réservation d'échéance 24h avant prélèvement
- Gel sur enquête (litige ou impayé)

**Consultations (lecture seule)**
- Solde total et décomposition en temps réel
- Historique transactions filtrable et exportable (PDF/CSV)
- Reçu de transaction téléchargeable avec référence unique

### 4.4 Invariant comptable

**Tout mouvement génère une transaction immuable** avec motif, montant signé, horodatage, référence unique. La somme algébrique de toutes les transactions doit toujours égaler le solde du wallet. Cet invariant n'est jamais brisé.

### 4.5 Outil de correction back-office

Pour traiter les cas exceptionnels (erreur système, ajustement post-litige), un outil dédié permet aux agents BO autorisés de réaliser un ajustement entre comptes utilisateurs. Cet outil suit des règles strictes :

- Réservé aux agents disposant du grant `correction.execute`
- Motif obligatoire rattaché à un ticket ou une référence d'audit
- **Double signature obligatoire** : agent + superviseur
- **Transaction visible** dans l'historique des deux utilisateurs avec libellé clair "Ajustement plateforme #référence"
- Notifications push + email envoyées aux deux utilisateurs concernés
- Possibilité de contester via ouverture d'un ticket litige
- Log immuable : agent, superviseur, motif, montant, horodatage, IP, ticket de référence

Aucune fonctionnalité cachée. Tout est visible, justifié, traçable.

---

## 5. Module Tontines

### 5.1 Principe

La plateforme propose deux modèles de tontines :

- **Rotative** (ROSCA) : cagnotte qui tourne, un bénéficiaire par cycle.
- **Épargne collective** : chaque membre cumule pour lui-même, payout à maturité.

**C'est la plateforme (admin) qui crée et configure les tontines.** Les utilisateurs **ne créent pas** de tontine eux-mêmes : ils parcourent un catalogue de tontines `ouvertes aux inscriptions`, choisissent celles qui leur conviennent, et s'y inscrivent librement (sous réserve d'éligibilité). Les participants restent **anonymes entre eux**.

### 5.2 Paramètres définis à la création par l'admin

L'admin fixe (dans une fourchette plafond définie par la plateforme) :

- Nom et description de la tontine
- Type (rotative ou épargne)
- Montant de cotisation par cycle
- Fréquence des cycles (quotidienne, hebdomadaire, mensuelle)
- Nombre de places (= nombre de participants)
- **Montant de caution** à bloquer à la souscription (peut être à 0)
- **Niveau KYC minimum requis** pour s'inscrire
- **Mode de tirage** (rotative uniquement) :
  - **Ordre révélé** : l'ordre des bénéficiaires est connu de tous dès l'ouverture des inscriptions
  - **Aléatoire à chaque tour** : le bénéficiaire de chaque tour est tiré au sort à l'ouverture du cycle, parmi les participants pas encore servis
- **Date de démarrage** souhaitée
- **Fenêtre de désistement** en jours avant la date de démarrage
- **Pourcentage de pénalité** retenu sur la caution si désistement à l'intérieur de la fenêtre
- **Bonus de fidélité** (activé / désactivé) et son taux

Tous ces paramètres sont affichés clairement à tout candidat avant souscription. Aucune surprise possible.

### 5.3 Cycle de vie

**Phase 1 — Constitution (anonyme, modèle hybride)**
1. Création et publication de la tontine par l'admin
2. Tontine listée dans le catalogue public, visible aux utilisateurs au niveau KYC requis
3. Inscription des participants (« premier arrivé, premier servi ») — à l'inscription, **seule la caution est prélevée et bloquée immédiatement** (preuve d'engagement, équivalent du contrat signé). La 1ère cotisation **n'est pas encore débitée**.
4. L'inscription est refusée si :
   - le wallet ne couvre pas la caution
   - l'utilisateur a une **dette ouverte** ou un dossier de recouvrement actif
   - l'utilisateur a atteint son **nombre maximum de tontines simultanées**
5. Tant que la tontine n'est pas complète, elle reste en phase de constitution

**Désistement avant démarrage** :
- **En dehors de la fenêtre de désistement** : caution intégralement débloquée
- **À l'intérieur de la fenêtre** : une partie de la caution (taux paramétré) est retenue et reversée au fond de réserve de la tontine

**Après démarrage** : le désistement n'est plus possible. L'utilisateur doit aller jusqu'au bout (ou subir le mécanisme de défaut, cf. § 5.4).

**Phase 2 — Démarrage**
- À la **date de démarrage**, si le quota d'inscrits est atteint, le système démarre la tontine automatiquement et notifie tous les souscripteurs
- **Sinon, la tontine bascule dans une file « à démarrer »** au back-office. L'admin tranche : démarrer quand même avec les inscrits, reporter la date de démarrage, ou annuler (annulation = caution débloquée pour tous)

**Prélèvement de la 1ère cotisation au démarrage** :
- À l'instant du démarrage, le système **tente immédiatement** de prélever la 1ère cotisation de chaque membre actif.
- **Membre solvable** : prélèvement effectué, cotisation du cycle 1 marquée comme payée. ✅
- **Membre insolvable** : un **délai de grâce paramétrable** (par défaut **2 jours**) lui est accordé. Pendant ces 2 jours, l'utilisateur peut approvisionner son wallet par mobile money ou virement. À l'expiration du délai, si la cotisation n'est toujours pas réglée, **une dette est ouverte** (cf. § 8.7 Recouvrement). La dette peut courir 1, 2, 6, n mois — l'utilisateur peut continuer à participer aux cycles suivants, **mais il ne touchera pas sa cagnotte le jour de son tour tant que la dette n'est pas réglée**.

**Phase 3 — Cycles de cotisation**
1. **Cycle 1 — Constitution du fond de réserve** : les cotisations de tous les participants sont collectées et versées dans le fond de réserve interne de la tontine. Aucun tirage au sort n'est effectué à ce cycle. Aucune information spécifique n'est communiquée aux participants sur la nature de ce cycle.
2. **Cycles 2 à N+1 — Distributions** : à chaque échéance, prélèvement automatique sur le wallet de chaque participant
3. Si solde suffisant : cycle continue normalement
4. Si solde insuffisant : pénalité prélevée sur la caution + relance, délai de régularisation accordé
5. Tirage au sort du gagnant parmi les non-encore-servis
6. Versement de la cagnotte sur le wallet du gagnant
7. Le cycle se répète jusqu'à ce que tous les participants aient reçu leur cagnotte

**Phase 4 — Clôture**
- Tous les participants ont reçu leur cagnotte
- Cautions résiduelles libérées (si pas de pénalité subie)
- Tontine archivée, historique consultable à vie

### 5.4 Gestion des défauts

**Cotisation manquée** : si au moment de la collecte d'un cycle le wallet d'un membre ne couvre pas la cotisation, celle-ci est marquée « manquée » et une **dette dédiée** est immédiatement créée à son nom (1 cotisation manquée = 1 dette). Le mécanisme de recouvrement (cf. § 8.7) prend le relais : relances, auto-débit dès qu'une recharge arrive, escalade éventuelle.

**Cycles manqués consécutifs (seuil paramétrable, par défaut 2)** :
- La **caution** est intégralement retenue (versée au fond de réserve de la tontine)
- Le membre passe en statut **« défaillant »** : sa participation est bloquée
- S'il n'avait pas encore reçu sa cagnotte, **son tour est suspendu** (la cagnotte de son cycle, si elle a déjà été collectée auprès des autres, reste à la plateforme jusqu'à décision d'un agent)
- Seul un **agent recouvrement** peut décider, plus tard, de lever ce blocage (« libérer le membre »)

**Bonus de fidélité (récompense optionnelle)** : si activé à la création de la tontine et que la tontine se termine nominalement, un pourcentage du fond de réserve est distribué aux bénéficiaires de la **2ème moitié des tours** (du rang médian au dernier), avec une pondération **croissante** : le dernier servi reçoit la plus grosse part. Objectif : inciter les membres servis tardivement à tenir jusqu'au bout au lieu de décrocher.

### 5.5 Fond de réserve — Modèle économique interne *(Usage interne — Non communiqué aux participants)*

> ⚠️ Cette section est strictement confidentielle. Ces règles de gestion ne doivent jamais être affichées, mentionnées ou accessibles côté utilisateur, sous quelque forme que ce soit.

**Principe général**

Pour toute tontine de N participants, le système génère N+1 cycles de cotisation. Les N+1 cotisations du cycle 1 (un versement par participant) constituent le **fond de réserve** de la tontine. Ce fond n'est distribué à aucun participant.

**Exemple concret**

| Paramètre | Valeur |
|-----------|--------|
| Nombre de participants | 10 |
| Cotisation mensuelle | 100 000 XOF |
| Cycles affichés | 11 mois |
| Fond de réserve (cycle 1) | 10 × 100 000 = **1 000 000 XOF** |
| Cycles de distribution | Mois 2 à 11 (1 gagnant par mois) |

**Utilisation du fond de réserve**

Le fond de réserve sert en priorité à couvrir les impayés des participants défaillants, dans les cas où la caution individuelle est insuffisante ou épuisée. Il agit comme filet de sécurité interne permettant à la tontine de se poursuivre sans perturber les autres participants.

**Clôture et bénéfice plateforme**

À la clôture de la tontine (tous les participants ont été servis), le solde résiduel du fond de réserve est intégralement versé à la trésorerie de la plateforme. Il constitue le **bénéfice net de la plateforme** sur cette tontine.

| Scénario | Résultat pour la plateforme |
|----------|-----------------------------|
| Aucun impayé | Fond de réserve intégral = bénéfice maximum |
| Impayés partiellement couverts | Fond résiduel après couverture = bénéfice partiel |
| Impayés dépassant le fond | Fond épuisé, recours aux cautions, bénéfice nul sur ce cycle |

**Règle de non-divulgation**

Aucun participant ne doit être informé de l'existence du fond de réserve, de son montant, de son utilisation ou de sa destination finale. Cette mécanique est un élément du modèle économique de la plateforme et relève du secret commercial. Elle ne constitue pas une fonctionnalité cachée au sens des présentes spécifications — les participants paient exactement ce qui leur est affiché — mais une règle interne d'allocation des fonds collectés.

---

## 6. Module Cotisation Personnelle

### 6.1 Principe

La cotisation personnelle est un produit d'épargne individuelle, distinct des tontines. L'utilisateur épargne pour lui-même, à son rythme et selon ses objectifs. Aucun autre participant n'est impliqué. Les fonds sont hébergés dans le wallet de l'utilisateur sous forme de **poches dédiées**, visibles séparément du solde principal.

Un utilisateur peut ouvrir plusieurs cotisations simultanément, de types différents.

**Niveau requis** : niveau 1 minimum (CIP vérifié).

**Intérêts** : aucun au MVP. Le produit est un outil d'organisation et de discipline d'épargne, pas un placement rémunéré. Une rémunération pourra être envisagée en phase 2.

### 6.2 Les quatre types de cotisation

---

#### Type 1 — Épargne libre (Tirelire)

L'utilisateur verse ce qu'il veut, quand il veut, et retire quand il veut.

| Paramètre | Valeur |
|-----------|--------|
| Montant des versements | Libre, sans minimum |
| Fréquence | Libre, aucune obligation |
| Retrait | À tout moment, sans délai ni pénalité |
| Blocage des fonds | Aucun — fonds disponibles |

**Usage typique** : tirelire numérique, cagnotte personnelle, petite réserve de précaution.

---

#### Type 2 — Épargne programmée

L'utilisateur s'engage sur un montant fixe et une fréquence de prélèvement. Le retrait reste libre.

| Paramètre | Valeur |
|-----------|--------|
| Montant des versements | Fixe, défini à la création |
| Fréquence | Hebdomadaire, bimensuelle ou mensuelle |
| Retrait | À tout moment, sans pénalité |
| Blocage des fonds | Aucun — fonds disponibles |
| Modification | L'utilisateur peut suspendre ou modifier la programmation à tout moment |

**Prélèvement automatique** : comme pour les tontines, le système débite le wallet à l'échéance. Si le solde est insuffisant, le prélèvement est ignoré ce cycle (pas de pénalité, notification envoyée).

**Usage typique** : épargne régulière automatisée, discipline financière.

---

#### Type 3 — Épargne bloquée

L'utilisateur s'engage sur une durée. Les fonds versés sont bloqués jusqu'à l'échéance.

| Paramètre | Valeur |
|-----------|--------|
| Montant des versements | Fixe ou libre (défini à la création) |
| Fréquence | Selon le mode choisi (programmé ou ponctuel) |
| Durée | Définie à la création (ex : 3, 6, 12 mois) |
| Retrait anticipé | **Impossible** |
| Retrait à l'échéance | Automatique vers le solde disponible du wallet |
| Blocage des fonds | **Oui — solde bloqué jusqu'à l'échéance** |

**Clôture** : à l'échéance, les fonds sont automatiquement libérés et créditent le solde disponible. Notification envoyée.

**Usage typique** : épargne de projet (mariage, rentrée scolaire, investissement), auto-discipline forte.

---

#### Type 4 — Épargne avec objectif

L'utilisateur fixe un montant cible et une date limite. La progression est visible en temps réel.

| Paramètre | Valeur |
|-----------|--------|
| Montant cible | Défini à la création |
| Date limite | Définie à la création |
| Montant des versements | Libre ou programmé (au choix) |
| Retrait | Possible à tout moment (avec avertissement sur l'objectif) |
| Blocage des fonds | Aucun — fonds disponibles malgré l'objectif |

**Indicateurs affichés à l'utilisateur :**
- Barre de progression (montant versé / montant cible)
- Montant restant à épargner pour atteindre l'objectif
- Jours restants avant la date limite
- Estimation dynamique : "à ce rythme, vous atteindrez votre objectif le [date]"

**Notifications proactives :**
- Rappel si aucun versement depuis X jours alors que l'objectif n'est pas atteint
- Alerte si la date limite approche et que l'objectif est loin
- Félicitation quand l'objectif est atteint

**Usage typique** : achat planifié, voyage, fonds d'urgence, projet personnel.

---

### 6.3 Règles communes à tous les types

**Intégration wallet**
- Chaque cotisation personnelle constitue une poche séparée, visible dans le détail du wallet
- Les fonds des épargnes bloquées apparaissent dans le **solde bloqué** du wallet, avec le motif "Épargne bloquée #référence"
- Les fonds des épargnes libres, programmées et avec objectif apparaissent dans le **solde disponible**, identifiés par leur poche

**Opérations disponibles**
- Versement manuel depuis le wallet (toujours possible sauf si wallet insuffisant)
- Versement automatique selon la programmation (types 2, 3 et 4 en mode programmé)
- Consultation du solde et de l'historique de la poche
- Clôture anticipée (sauf type 3 bloqué) : fonds rapatriés sur le wallet principal

**Historique et traçabilité**
- Chaque versement et retrait génère une transaction immuable avec référence unique
- Historique consultable et exportable (PDF/CSV) par poche et globalement
- Reçus téléchargeables

**Notifications**
- Confirmation de chaque versement (push + in-app)
- Rappels d'échéance pour les épargnes programmées (24h avant)
- Alerte si prélèvement automatique échoue (solde insuffisant)
- Notification de clôture et de libération des fonds

---

## 7. Module Prêts

### 7.1 Principe

La plateforme accorde des prêts en XOF sur sa propre trésorerie. Aucun prêt entre utilisateurs. Le scoring interne et les justificatifs (au-delà d'un certain seuil) déterminent qui peut emprunter combien.

### 7.2 Plafond d'emprunt

**Plafond = minimum de trois critères :**

1. **Plafond KYC** : valeur fixe par niveau (configurable au BO)
2. **Plafond score** : calculé sur l'historique plateforme (tontines complétées, taux de défaut, ancienneté)
3. **Plafond revenus** : 3× le revenu mensuel déclaré (justifs niveau 2 requis)

### 7.3 Garanties exigées

- **Petits montants** (sous un seuil X défini par la plateforme) : aucune garantie, scoring suffit
- **Gros montants** : justificatifs de revenus obligatoires + scoring renforcé + revue manuelle BO

### 7.4 Taux d'intérêt

**Taux dynamique** configuré au back-office par les super-admins :
- Grilles modulables selon score, durée, montant, devise
- Taux affiché à la souscription **figé pour ce prêt** (l'utilisateur ne subit pas une hausse en cours de remboursement)

### 7.5 Durée

**Configurable au BO selon le profil utilisateur** : les super-admins définissent les durées maximales par tranche de score (par exemple 3 mois pour score moyen, 12 mois pour score élevé).

### 7.6 Score de crédit interne

Score sur 1000 calculé en temps réel à partir de :

- **Historique tontines** (forte pondération) : nombre complétées, régularité des cotisations, absence de défaut majeur
- **Historique prêts** (forte pondération) : prêts précédents remboursés, retards cumulés, pénalités subies
- **Activité wallet** (pondération moyenne) : volume mensuel moyen, stabilité, fréquence d'usage
- **Profil et ancienneté** (pondération moyenne) : âge du compte, niveau KYC, revenus
- **Signaux négatifs** (impact direct) : tickets litige, signalements fraude, comptes gelés — score plafonné si signal actif

**Tranches et conséquences :**
- 0–399 : aucun prêt accessible
- 400–699 : petits montants seulement, taux élevé
- 700–1000 : tous montants éligibles, taux préférentiel

### 7.7 Cycle de vie du prêt

1. **Simulation** : utilisateur saisit montant, durée, devise — plafond et taux calculés en direct
2. **Soumission** : taux figé, demande créée
3. **Vérifications automatiques** : KYC, plafonds, fraude, anti-blanchiment
4. **Décision** :
   - Petit montant + score suffisant → octroi automatique
   - Gros montant ou cas limite → revue manuelle BO (officier conformité + super-admin, double signature)
5. **Déblocage** : crédit du wallet sous double signature
6. **Remboursement** : à chaque échéance, prélèvement automatique sur le wallet
   - Si solde OK → débit, échéance honorée
   - Si solde insuffisant → demande de paiement avec lien mobile money, délai de régularisation
7. **Remboursement anticipé autorisé sans pénalité** : l'utilisateur économise les intérêts non échus
8. **Clôture** : toutes échéances payées, dossier archivé

### 7.8 Recouvrement strict

**1 seule échéance impayée** au-delà du délai de régularisation déclenche immédiatement :

- **Gel total du wallet** (passage du disponible en bloqué)
- **Suspension de l'accès aux tontines** (plus de nouvelle souscription possible)
- **Ouverture automatique d'un dossier de recouvrement** côté BO
- **Notification SMS + email + push** à l'utilisateur

C'est ferme mais cohérent : la plateforme prête sur sa propre trésorerie et n'a aucun groupe pour absorber le risque.

---

## 8. Module Litiges et réclamations

### 8.1 Ouverture d'un ticket

**Un seul flux unifié** : l'utilisateur décrit son problème en texte libre et joint des pièces si besoin. Le système et les agents s'occupent de la catégorisation et de l'orientation.

### 8.2 Quatre niveaux d'escalade

| Niveau | Acteur | Rôle |
|--------|--------|------|
| 1 | Agent support | Résolution simple, orientation, première réponse |
| 2 | Superviseur | Cas complexe ou contesté |
| 3 | Officier conformité | Cas financier, audit complet, gel possible |
| 4 | Super-admin | Arbitrage final, possibilité de saisir les autorités externes |

### 8.3 Trois niveaux de gravité avec SLA

**Urgent** (fraude active, identité usurpée, transferts suspects)
- Niveau 1 : 1h max — Niveau 2 : 4h max — Niveau 3 : 12h max
- **Gel conservatoire automatique** en attendant l'instruction

**Normal** (litige financier sans suspicion de fraude)
- Niveau 1 : 24h max — Niveau 2 : 48h max — Niveau 3 : 72h max
- Pas de gel automatique, décision au cas par cas

**Faible** (question d'usage, demande d'explication)
- Niveau 1 : 72h max — Niveau 2 : 5 jours max — Niveau 3 : rarement requis
- Réponse pédagogique, traçage pour amélioration produit

**Reclassification** : l'agent peut requalifier la gravité à la hausse à tout moment, le SLA est alors recalculé.

**Escalade automatique** : SLA non tenu déclenche escalade au niveau supérieur.

### 8.4 Mesures conservatoires

À toute étape selon la gravité :
- Gel temporaire du wallet concerné
- Suspension d'accès aux tontines
- Blocage des prélèvements en cours
- Conservation des preuves numériques
- Notification motivée à l'utilisateur

### 8.5 Saisine des autorités externes

Pour les cas les plus graves (fraude organisée, blanchiment suspecté, identité usurpée à grande échelle), le super-admin peut décider de transmettre le dossier à :

- Police judiciaire
- BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)
- GIABA (Groupe Intergouvernemental d'Action contre le Blanchiment d'Argent en Afrique de l'Ouest)
- Équivalents nationaux selon la devise concernée

Dossier transmis sous scellé, traçabilité totale conservée.

### 8.6 Traçabilité complète

L'auditeur peut reconstituer l'intégralité d'un dossier à tout moment : chaque action, chaque message, chaque mesure conservatoire conservée immuablement.

### 8.7 Recouvrement (équipe interne dédiée)

Tout litige financier dans lequel un utilisateur **doit** de l'argent à la plateforme est traité par une **équipe interne de recouvrement**, distincte du support de tickets. Ce module poursuit les débiteurs ; il ne traite pas les réclamations entrantes.

**Flux**
1. **Création de dette** : à chaque cotisation manquée (ou autre créance), une dette est ouverte au nom de l'utilisateur (1 cotisation manquée = 1 dette, granularité fine).
2. **Auto-débit silencieux** : tant que la dette est ouverte, toute recharge du wallet la solde automatiquement (les plus anciennes en premier). Le mécanisme est invisible pour les autres modules — l'utilisateur recharge, la dette s'éteint, la cotisation correspondante repasse en « payée ».
3. **Relances automatiques** : si la dette n'est pas soldée, des relances multi-canal (par défaut **push + SMS**) sont envoyées à intervalle régulier (paramétrable, défaut 2 jours), jusqu'à un nombre maximum (défaut 3).
4. **Escalade automatique** : passé le seuil maximum de relances sans paiement, la dette est marquée **en recouvrement** et un **dossier** est ouvert dans la file commune de l'équipe.
5. **File commune + auto-assignation** : tout agent disposant des bons grants peut s'auto-assigner un dossier de la file.
6. **Travail journalisé** : l'agent ajoute des actions (note, appel, plan de paiement, paiement reçu) — chaque action est conservée immuable.
7. **Encaissement manuel** : si l'agent reçoit un paiement en cash, il l'enregistre via une action « paiement reçu » qui décrémente la dette.
8. **Clôture** : l'agent peut marquer le dossier résolu (dette intégralement réglée) ou irrécouvrable (passage en perte).

**Tontine défaillant** : un membre tontine en statut « défaillant » (cf. § 5.4) ne peut être réintégré qu'à la décision d'un agent disposant du grant de résolution. Cette décision libère sa participation pour les cycles à venir mais ne lui restitue pas automatiquement la cagnotte ou la caution déjà perdues.

**Blocages générés par une dette ouverte** : tant qu'une dette est en cours, l'utilisateur ne peut pas retirer de son wallet ni s'inscrire à une nouvelle tontine (cf. § 4 et § 5.3).

**Notifications utilisateur** : chaque relance et chaque escalade déclenchent une notification dédiée. L'utilisateur consulte ses dettes (montant dû, restant, nombre de relances) depuis son app.

---

## 9. Méthodes de paiement

### 9.1 Trois canaux supportés au MVP

| Canal | Recharge | Retrait | Intermédiaire | Cas d'usage |
|-------|----------|---------|--------------|-------------|
| **Mobile money** (MTN, Moov, Celtiis) | Instantanée | Instantané | Agrégateur unique (KKiapay/FedaPay/PaySika) | Quotidien |
| **Virement bancaire** | 24-72h | 24-48h | Banque partenaire | Gros montants, diaspora |
| **Carte bancaire** | Instantanée | Non disponible | Passerelle pro avec 3DS | Urgence, international |

**Mobile Money dans le KYC niveau 3** : l'utilisateur peut enregistrer son numéro Mobile Money (opérateur + numéro) **indépendamment** de son compte bancaire. Beaucoup d'utilisateurs au Bénin n'ont pas de compte bancaire mais ont du Mobile Money — exiger une banque pour valider un numéro Mobile Money serait un frein injustifié. Banque, Mobile Money et garant sont trois sous-sections autonomes du niveau 3.

### 9.2 Plafonds et frais

- **Plafonds quotidiens** : alignés sur les limites de chaque opérateur mobile money, configurables au BO
- **Frais** : refacturation des coûts opérateur réels, sans marge cachée
- L'utilisateur voit clairement la décomposition : "Montant X, Frais opérateur Y, Total Z"

### 9.3 Sécurité OTP

**OTP obligatoire pour tous les montants** de retrait et recharge. Pas de seuil bas exempté. Sécurité maximale, signal fort de confiance utilisateur.

Pour les retraits : **OTP + biométrie** (double facteur).

### 9.4 Logique de fallback

**Fallback intra-méthode automatique** : si MTN échoue ou ne répond pas, le système tente Moov, Orange, Wave dans l'ordre, sans demander à l'utilisateur. C'est transparent puisque l'utilisateur reste dans son intention initiale (mobile money).

**Fallback inter-méthode manuel** : si tous les opérateurs mobile money échouent, la plateforme **propose** à l'utilisateur de basculer sur carte ou virement. L'utilisateur choisit explicitement, jamais de débit sans son accord.

### 9.5 Workflow virement bancaire (cas particulier)

1. Utilisateur choisit "recharge par virement"
2. **Référence unique** générée et affichée
3. Coordonnées bancaires plateforme (RIB) affichées avec instructions
4. Transaction "**en attente**" visible dans l'historique de l'utilisateur
5. Utilisateur fait son virement depuis sa banque (hors plateforme)
6. **Réconciliation automatique** : scan API banque toutes les heures
7. Si référence trouvée : crédit du wallet + notification immédiate
8. Si délai dépassé : escalade au BO (agent treasury)
9. **Crédit manuel possible avec preuve**, configurable au BO selon le contexte, sous double signature

### 9.6 Réconciliation

- Tâche planifiée toutes les heures pour rapprocher transactions internes et webhooks
- Tableau BO de réconciliation avec écarts détectés et actions correctives
- Export comptable mensuel pour la trésorerie de la plateforme

---

## 10. Notifications et communications

### 10.1 Principe — Trois niveaux de criticité

Le **système classe automatiquement** chaque notification selon sa nature et choisit les canaux. L'utilisateur ne configure pas la criticité, il configure ses adresses (téléphone, email).

**Principe de coût** : **le SMS est strictement réservé aux notifications critiques** (sécurité / accès au compte). Toutes les autres communications passent par **push + email** afin de minimiser les frais opérateur SMS (Africa's Talking, etc.). Le canal SMS reste activable manuellement depuis le BO pour un envoi ciblé, mais jamais en automatique sur les flows non critiques.

### 10.2 Niveau critique — SMS + Email obligatoire

Non désactivable. Push et in-app en complément.

- OTP de retrait, recharge, virement, paiement de prêt
- OTP de login et de vérification de compte
- Détection de connexion suspecte ou fraude
- Gel ou levée de gel du wallet
- Saisine d'une autorité externe

### 10.3 Niveau important — Email + push (pas de SMS automatique)

Plus in-app systématique. SMS désactivé par défaut pour économies.

- Validation ou refus de KYC par agent BO
- Demande agent de pièce KYC complémentaire
- Échec de prélèvement avec demande d'action urgente
- Confirmation de recharge ou retrait effectué
- Cagnotte de tontine reçue
- Octroi de prêt et déblocage des fonds
- Échéance de cotisation honorée ou prêt remboursé
- Reçus et justificatifs disponibles
- Réponse à un ticket de litige
- **Relances de recouvrement automatiques** (auparavant push+SMS, désormais **push+email**)

### 10.4 Niveau confort — Push et in-app uniquement

Gratuit et confortable.

- Rappel d'échéance 24h avant
- Statut d'avancement de tontine
- Nouvelle tontine correspondant au profil
- Mise à jour du score interne
- Information de service (mises à jour, maintenance)
- Conseils et astuces

### 10.5 Centre de notifications dans l'app

- Toutes les notifications avec marquage lu/non lu
- Filtres par catégorie (Tontines, Prêts, Wallet, Sécurité, Compte)
- Recherche, archivage, exports
- Historique illimité

### 10.6 Timing et fiabilité

- **Temps réel strict**, pas de groupement par lots
- **Retry automatique** : 3 tentatives espacées en cas d'échec
- **Escalade BO** si une notification critique reste non délivrée après tous les retries
- Suivi du statut "envoyé" → "délivré" → "lu" quand possible

---

## 11. Back-office et système de grants

### 11.1 Anatomie d'un grant

Un grant est une permission élémentaire composée de :

- **Verbe** : `read`, `write`, `approve`, `execute`
- **Ressource** : `kyc`, `treasury`, `user`, `compliance`, etc.
- **Portée** : `own` (ses propres dossiers), `team` (l'équipe), `all` (toute la plateforme)
- **Conditions** : montant maximum, plage horaire, IP autorisée
- **Expiration** : durée ou date butoir

### 11.2 Règles non négociables

- **Aucun mouvement d'argent sans 2 signatures** (verrou architectural)
- Aucun grant cumulable seul ne donne pouvoir absolu
- Tout est loggé immuablement (qui, quand, depuis où, quoi)
- **Sessions BO expirent en 30 minutes** d'inactivité
- **2FA obligatoire** sur le back-office (pas de simple mot de passe)
- Chaque action sensible nécessite re-authentification immédiate

### 11.3 Tableau de bord BO

Chaque rôle dispose d'une vue dédiée à ses tâches :

- Agent KYC : file des dossiers à vérifier
- Officier conformité : alertes, gels en cours, audits programmés
- Agent support : tickets ouverts, SLA en cours
- Trésorier : opérations à valider, réconciliations
- Super-admin : vue d'ensemble + outils de configuration
- Auditeur : moteur de recherche universel sur les logs

---

## 12. Sécurité et conformité

### 12.1 Authentification utilisateur

- Inscription : téléphone + OTP + mot de passe fort
- Connexion : mot de passe + OTP au premier accès depuis un nouvel appareil
- Actions sensibles : OTP + biométrie (retraits, demandes de prêt, modification KYC)

**Anti-brute-force sur tous les codes courts** (OTP login, code de vérification de compte, code de reset password) :
- Compteur d'essais ratés partagé entre les 3 codes (un attaquant ne peut pas contourner en alternant les types)
- Au-delà de **5 essais consécutifs ratés**, le compte est **verrouillé pendant 15 minutes** : tout code en cours est purgé, le user doit refaire une demande après expiration du verrou
- Verrou et compteur réinitialisés automatiquement à la première saisie correcte
- Logué côté audit ; un verrou répétitif déclenche une alerte BO pour investigation

### 12.2 Anti-fraude continu

- Détection de patterns inhabituels : montants ronds suspects, fréquence anormale
- Vérification de cohérence géolocalisation
- Numéros bénéficiaires différents → blocage temporaire automatique
- Score de risque calculé en temps réel à chaque opération

### 12.3 Auditabilité

- Tout log est immuable (write-once)
- Conservation minimum 10 ans (exigence anti-blanchiment)
- Accès auditeur par moteur de recherche multicritère
- Export forensique en cas de demande judiciaire

### 12.4 Protection des données

- Pas de stockage des photos CIP au-delà du nécessaire à la vérification
- Chiffrement au repos et en transit
- Conformité RGPD pour les utilisateurs européens (cas de la diaspora)

### 12.5 Coopération avec les autorités

La plateforme prévoit des canaux dédiés pour répondre aux requêtes officielles :
- Demandes judiciaires
- Contrôles BCEAO
- Audits anti-blanchiment GIABA

---

## 13. Roadmap post-MVP

### 13.1 Module Actions / Projets externes

Reporté en phase 2. Décisions déjà prises à reprendre à ce moment :

- Type de retour : au choix du porteur (dividendes, intérêts ou plus-value)
- Validation projet : back-office + dépôt de garantie obligatoire
- Parts bloquées jusqu'à la fin du projet, pas de marché secondaire

Points à clarifier avant développement :
- Statut juridique : agrément CREPMF ou équivalent selon devise
- Profil porteur autorisé : particulier, PME, coopérative
- Mécanisme de séquestre des fonds collectés
- Échéancier de libération des fonds au porteur

Pré-requis techniques à anticiper côté MVP :
- Le wallet doit déjà supporter le concept de fonds séquestrés
- Le système KYC doit pouvoir distinguer types de comptes
- L'auditabilité doit déjà couvrir les futurs flux de redistribution

### 13.2 Multi-devises

XAF, Naira, Yen, Rouble, Dollar, Euro avec conversion via API de change professionnelle, taux en temps réel, transparence sur les frais.

### 13.3 Fonctionnalités complémentaires envisagées

- Épargne avec objectifs (tirelires)
- Programme de parrainage
- Cartes virtuelles plateforme
- Intégration agences physiques (espèces)

---

## 14. Glossaire

| Terme | Définition |
|-------|-----------|
| **CIP** | Carte d'Identification Personnelle, document national béninois unique par personne physique |
| **KYC** | Know Your Customer, processus de vérification d'identité |
| **Wallet** | Compte interne en XOF de l'utilisateur sur la plateforme |
| **Caution** | Somme bloquée à la souscription d'une tontine, garantissant l'engagement |
| **Première cotisation** | Cotisation du tout premier cycle de l'utilisateur. **Modèle hybride** : la caution est bloquée à l'inscription (preuve d'engagement) ; la 1ère cotisation est prélevée **au démarrage** de la tontine. Si l'utilisateur n'a pas le solde au démarrage, un délai de grâce paramétrable lui est accordé avant ouverture d'une dette. |
| **Délai de grâce 1ère cotisation** | Nombre de jours (défaut 2) pendant lesquels un nouvel inscrit peut approvisionner son wallet pour régler sa 1ère cotisation après le démarrage. Au-delà, une dette est ouverte ; l'utilisateur participe aux cycles suivants mais ne reçoit pas sa cagnotte tant que la dette n'est pas réglée. |
| **Verrou anti-brute-force** | Blocage temporaire de 15 minutes appliqué au compte après 5 essais ratés sur un code court (OTP login, code de vérification, code de reset). Partagé entre les 3 codes ; réinitialisé après une saisie correcte. |
| **Cycle** | Période entre deux versements de cagnotte dans une tontine |
| **Cagnotte** | Somme collectée à un cycle, versée au gagnant tiré au sort |
| **Mode de tirage** | Façon dont les bénéficiaires d'une tontine rotative sont désignés : *révélé* (ordre fixe affiché à tous d'avance) ou *aléatoire à chaque tour* |
| **Bonus de fidélité** | Pourcentage du fond de réserve redistribué aux derniers bénéficiaires en récompense d'aller jusqu'au bout |
| **Membre défaillant** | Statut d'un participant ayant manqué le seuil de cycles consécutifs : caution perdue, participation bloquée, payouts suspendus jusqu'à décision agent |
| **Score** | Note interne sur 1000 calculée en temps réel sur le profil utilisateur |
| **Score de confiance** | Score numérique interne évoluant à chaque événement utilisateur (cotisation à temps, défaut, dette recouvrée, désistement…). Sert d'aide à la décision admin. Jamais affiché à l'utilisateur |
| **Dette** | Créance ouverte au nom de l'utilisateur (1 cotisation manquée = 1 dette). Auto-soldée par toute recharge wallet ultérieure |
| **Recouvrement** | Équipe interne dédiée qui poursuit les utilisateurs débiteurs après échec des relances automatiques |
| **max_tontines** | Nombre maximum de tontines simultanées par utilisateur, fixé manuellement par l'admin à la validation KYC niveau 2 ou 3 |
| **Mobile Money** | Compte de paiement mobile (MTN, Moov, Celtiis au Bénin). Peut être ajouté au KYC niveau 3 indépendamment d'un compte bancaire |
| **SLA** | Service Level Agreement, délai maximum garanti |
| **OTP** | One-Time Password, code à usage unique envoyé par SMS |
| **2FA** | Two-Factor Authentication, double facteur d'authentification |
| **Grant** | Permission élémentaire attribuée à un rôle back-office |
| **Poche** | Sous-compte dédié dans le wallet, associé à une cotisation personnelle ou un blocage spécifique |
| **Fond de réserve** | Premier cycle d'une tontine, collecté mais non distribué, absorbant les impayés et constituant le bénéfice de la plateforme à la clôture |
| **Agrégateur** | Service tiers regroupant plusieurs opérateurs mobile money en une API unique |
| **BCEAO** | Banque Centrale des États de l'Afrique de l'Ouest |
| **GIABA** | Groupe Intergouvernemental d'Action contre le Blanchiment d'Argent en Afrique de l'Ouest |
| **UEMOA** | Union Économique et Monétaire Ouest-Africaine, zone XOF |

---

**Fin du document de spécifications MVP**

*Ce document est le résultat d'un processus de cadrage itératif. Toute évolution doit être validée et reportée ici pour garantir la cohérence des décisions.*
