# Plateforme tontine — Spécifications fonctionnelles MVP

**Document de référence consolidé**
**Version 1.1**
**Date : mai 2026**

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
| **1** | CIP vérifié par agent BO | Recharger, cotiser tontine, recevoir cagnotte, retirer (plafonds modérés) |
| **2** | KYC renforcé : justificatifs domicile + revenus + activité pro | Demande de prêt, plafonds élevés, scoring crédit activé |
| **3** | Validation manuelle officier conformité + super-admin (double signature) | Très gros montants, prêts importants, traitement de litiges complexes — expire après 6 mois sans usage |

**Règle d'or** : aucune action sensible ne descend d'un cran. Un retrait reste verrouillé au niveau 1 même si l'utilisateur a atteint le niveau 3.

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

La plateforme propose des tontines rotatives ouvertes au public. Tout utilisateur niveau 1+ peut créer une tontine en fixant ses paramètres, elle apparaît dans le catalogue, d'autres utilisateurs s'y inscrivent jusqu'à ce qu'elle soit complète. Le système la démarre alors automatiquement et orchestre les cycles.

### 5.2 Paramètres définis à la création

Le créateur fixe librement (dans une fourchette plafond définie par la plateforme) :

- Nom et description de la tontine
- Montant de cotisation par cycle
- Fréquence des cycles (hebdomadaire, mensuelle, etc.)
- Nombre de places (= nombre de participants)
- **Montant de caution** à bloquer à la souscription
- **Pourcentage de pénalité** prélevé sur la caution en cas de défaut

**Durée affichée** : pour une tontine de N participants, la durée affichée est de **N+1 cycles**. Cette valeur est présentée telle quelle aux utilisateurs, sans explication particulière.

Tous ces paramètres sont affichés clairement à tout candidat avant souscription. Aucune surprise possible.

### 5.3 Cycle de vie

**Phase 1 — Constitution (anonyme)**
1. Création de tontine par un utilisateur
2. Tontine listée publiquement, visible aux niveaux 1+
3. Souscription des participants : caution prélevée et bloquée immédiatement
4. Tant que la tontine n'est pas complète, elle reste en phase de constitution

**Retrait avant démarrage** : possible à tout moment, mais **caution perdue intégralement**. La place est libérée pour un autre candidat.

**Phase 2 — Démarrage automatique**
- Dès que toutes les places sont remplies, le système déclenche le démarrage
- Notification envoyée à tous les souscripteurs

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

- 1 défaut → pénalité prélevée sur caution + relance
- Si la caution s'épuise par cumul de pénalités → le fond de réserve de la tontine prend le relais pour absorber le manque
- Si le fond de réserve est également épuisé → exclusion automatique du participant
- En cours de tontine, la place de l'exclu n'est pas remplacée
- Sa caution résiduelle reste en compensation pour les autres participants

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

---

## 9. Méthodes de paiement

### 9.1 Trois canaux supportés au MVP

| Canal | Recharge | Retrait | Intermédiaire | Cas d'usage |
|-------|----------|---------|--------------|-------------|
| **Mobile money** | Instantanée | Instantané | Agrégateur unique (KKiapay/FedaPay/PaySika) | Quotidien |
| **Virement bancaire** | 24-72h | 24-48h | Banque partenaire | Gros montants, diaspora |
| **Carte bancaire** | Instantanée | Non disponible | Passerelle pro avec 3DS | Urgence, international |

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

### 10.2 Niveau critique — SMS + Email obligatoire

Non désactivable. Push et in-app en complément.

- OTP de retrait, recharge, virement, paiement de prêt
- Validation ou refus de KYC par agent BO
- Gel ou levée de gel du wallet
- Détection de connexion suspecte ou fraude
- Échec de prélèvement avec demande d'action urgente
- Saisine d'une autorité externe

### 10.3 Niveau important — SMS ou Email selon configuration

Plus push et in-app systématique.

- Confirmation de recharge ou retrait effectué
- Cagnotte de tontine reçue
- Octroi de prêt et déblocage des fonds
- Échéance de cotisation honorée ou prêt remboursé
- Reçus et justificatifs disponibles
- Réponse à un ticket de litige

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
| **Cycle** | Période entre deux versements de cagnotte dans une tontine |
| **Cagnotte** | Somme collectée à un cycle, versée au gagnant tiré au sort |
| **Score** | Note interne sur 1000 calculée en temps réel sur le profil utilisateur |
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
