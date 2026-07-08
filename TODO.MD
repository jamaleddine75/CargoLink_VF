# CargoLink — Wallet Pages (4 Rôles) : Prompts UI/UX + Logique Complète de l'Argent

> Document généré après scan complet du repo `CargoLink_VF-main` (backend Spring Boot + frontend React/TS).
> Fichiers analysés principalement :
> - `backend/.../service/impl/WalletServiceImpl.java` (1778 lignes — cœur de toute la logique argent)
> - `backend/.../service/impl/PlatformWalletServiceImpl.java`
> - `backend/.../service/impl/PayoutServiceImpl.java`
> - `frontend/src/pages/admin/GlobalWallets.tsx`
> - `frontend/src/pages/agency/wallet/index.tsx`
> - `frontend/src/pages/driver/WalletPage.tsx`
> - `frontend/src/pages/client/CustomerWallet.tsx`

---

## 0. Les 4 Rôles et leurs Wallets

| Rôle | Fichier page actuel | Type de wallet backend | C'est qui |
|---|---|---|---|
| **Admin (Super Admin)** | `pages/admin/GlobalWallets.tsx` | `PlatformWallet` (wallet unique global) | Le propriétaire de la plateforme CargoLink |
| **Agency (Agence de livraison)** | `pages/agency/wallet/index.tsx` | `AgencyWallet` | Une agence partenaire qui a des drivers |
| **Driver (Livreur)** | `pages/driver/WalletPage.tsx` | `Wallet` (walletType = DRIVER) | Le livreur qui collecte le cash |
| **Customer (Client/Marchand)** | `pages/client/CustomerWallet.tsx` | `Wallet` (walletType = CUSTOMER) | Le marchand/expéditeur qui vend le colis (reçoit le COD net) |

---

## 1. PROMPTS UI/UX — Version Simplifiée (à donner à un designer ou à une IA de design)

### 🎯 Prompt Général (à coller avant chaque prompt spécifique)

```
Design a clean, minimal wallet page for a delivery/logistics platform.
Style: modern fintech app (like Wise / Revolut), NOT overly "hype" or flashy.
Use soft rounded cards, generous white space, one clear primary color for
positive amounts (green) and one for debt/pending (amber/red).
Mobile-first, responsive, single-column on mobile.
Avoid dense tables when possible — prefer stacked cards with icons.
Typography: one bold number as hero balance, small uppercase labels underneath.
```

---

### 🟣 1.1 — Prompt : Wallet Admin (Super Admin)

```
Create a "Platform Wallet" admin dashboard page.

Sections (top to bottom):
1. Hero row with 3 stat cards:
   - "Platform Balance" (cash actually held by the platform right now)
   - "Total Revenue" (sum of all delivery fees collected)
   - "Platform Profit" (the 5% margin only)
2. Secondary stat row:
   - "Total paid to Drivers"
   - "Total paid to Agencies"
   - "Pending Payout Requests" (count + amount)
3. Tabs: [Agency Ledger] [Withdrawal Queue] [Platform Nodes]
   - Agency Ledger: table of every agency wallet (balance, pending commission, total collected)
   - Withdrawal Queue: pending payout requests from drivers & agencies with
     Approve / Reject buttons
   - Platform Nodes: raw list of all wallets in the system (for audit)
4. A simple line/area chart: platform balance over time.

Keep it data-dense but readable — this is an internal ops screen, not a
consumer app. Use a dark or neutral theme with strong contrast for numbers.
```

**Simplification recommandée (par rapport à l'existant) :**
- L'actuel `GlobalWallets.tsx` a un style très "cyberpunk/italic uppercase" — trop chargé.
- Simplifier : garder juste 3 cartes stats claires + 1 tableau + 1 liste d'actions à approuver. Pas besoin de 3 onglets si l'admin est peu nombreux — un seul écran scrollable suffit.

---

### 🔵 1.2 — Prompt : Wallet Agence

```
Create an "Agency Wallet" page for a logistics agency manager.

Top: 3 stat cards
   - "Available Balance" (money the agency can withdraw)
   - "Total Commission Earned" (lifetime)
   - "Pending Commission" (not yet released / still locked)

Middle: a card list titled "Pending COD Remittances" — each item shows a
driver name, amount, order count, and a big "Confirm Receipt" button
(this is the moment the agency admin physically received cash from a driver).

Bottom: two side-by-side panels
   - Left: "Request Payout" simple form (amount + linked payment method +
     submit button), disabled if balance is 0.
   - Right: "Payout History" simple list (date, amount, status badge:
     Pending / Approved / Rejected / Paid).

Also include a collapsible "Commission History" list showing each completed
order's commission amount and date.

Keep visual weight low: this screen is used daily, so prioritize speed of
scanning over decoration.
```

**Simplification recommandée :**
- Supprimer les onglets multiples (Overview / Remittances / Payouts) et tout mettre sur un seul scroll vertical avec des sections claires — l'agence n'a pas besoin de naviguer entre onglets pour une tâche aussi fréquente.
- Le bouton "Confirmer Remise" doit être le plus visible de la page (c'est l'action la plus fréquente d'un agent d'agence).

---

### 🟢 1.3 — Prompt : Wallet Driver (Livreur)

```
Create a "My Wallet" page for a delivery driver (mobile-first, this is
used on a phone while on the road).

Top hero card (big, bold):
   - "Available Balance" — money the driver can actually withdraw (his
     earnings only, NOT the cash he's carrying)
   - Small secondary line: "Cash in hand: X MAD" and "Debt to system: X MAD"

Two big primary action buttons under the hero:
   - "Request Withdrawal" (disabled if balance = 0 OR if debt to system > 0)
   - "Declare Cash Deposit" (to remit collected COD cash to the agency)

Warning banner (only shows if debt > 0):
   "You are carrying X MAD of unremitted cash. You cannot withdraw until
   you remit it." — with a CTA button to open the remit flow.

Below: a simple tab switch [All] [Earnings] [COD Collections] showing a
transaction list (icon, description, amount +/-, date, status pill).

A small chart: daily earnings for the last 7/30 days.

Modals:
   - Withdrawal modal: amount input, min 200 MAD, shows converted payout
     currency, linked PayPal account.
   - Cash Deposit modal: list of orders with pending COD, checkboxes,
     auto-sum total, submit to declare remittance (or scan-based instant
     remit if agency QR is scanned).

This is the most-used screen for drivers — keep it extremely simple,
big tap targets, no small text, clear color coding: green = your money,
amber = cash you're holding for the platform, red = debt/blocked.
```

**Simplification recommandée :**
- Le point le plus important à clarifier visuellement (souvent source de confusion driver) : **"Available Balance" (ses gains, retirables) est différent de "Cash in hand" (l'argent physique COD+frais qu'il doit remettre)**. Actuellement ces 2 notions sont dans la même page mais pas assez visuellement séparées → à corriger en priorité dans un redesign.

---

### 🟠 1.4 — Prompt : Wallet Customer (Marchand/Client)

```
Create a "My Wallet" page for a merchant/customer who ships packages and
receives COD money back.

Hero card (large):
   - "Net Available Balance" — money the customer can withdraw right now
   - Two small side stats inside/below the hero:
     - "COD in Transit" (money collected by driver but not yet settled
       to the customer)
     - "Total COD Collected" (lifetime)

One primary button: "Request Withdrawal" (min 200 MAD, disabled if
balance <= 0).

A summary panel with 3 rows:
   - "Total delivery fees paid" (what the platform charged this customer)
   - "Delivered orders" (count)
   - "Average COD per order"

Below: transaction history list, each row tagged with a badge
(COD Credit / Withdrawal / Delivery Fee), amount colored green/red,
date, order reference.

Simple explanatory note near the balance:
   "You receive: COD amount collected − delivery fee, automatically
   credited once the agency confirms cash reception."

Keep this screen reassuring and simple — customers are not power users,
they just want to know "how much money is mine and when do I get it."
```

**Simplification recommandée :**
- Ajouter une **timeline visuelle simple** de 4 étapes par commande : `Livré → Cash collecté par driver → Confirmé par agence → Réglé sur mon wallet`. Ça enlève 90% des questions support "où est mon argent".

---

## 2. LOGIQUE BACKEND DE L'ARGENT (détaillée, basée sur le code réel)

### 2.1 Les 2 montants sur chaque commande (`Order`)

Chaque commande a :
- `deliveryFee` → les frais de livraison payés à la plateforme
- `codAmount` → le montant Cash On Delivery que le driver doit collecter chez le client final (le destinataire du colis)

---

### 2.2 Étape 1 — Livraison terminée (`handleOrderDelivery`)

Quand un driver marque une commande comme **DELIVERED**, le backend fait un split immédiat des `deliveryFee` :

```
adminShare   = deliveryFee × 5%                      // marge fixe plateforme
remainingFee = deliveryFee − adminShare
agencyShare  = remainingFee × commissionRate agence   // par défaut 15%
driverShare  = remainingFee − agencyShare              // le reste va au driver
```

**Exemple concret** avec `deliveryFee = 30 MAD` et commission agence par défaut 15% :
| Part | Calcul | Montant |
|---|---|---|
| Platform (admin) | 30 × 5% | **1.50 MAD** |
| Reste à répartir | 30 − 1.50 | 28.50 MAD |
| Agence | 28.50 × 15% | **4.28 MAD** |
| Driver | 28.50 − 4.28 | **24.22 MAD** |

> 💡 Le taux de commission de l'agence (`commissionRate`) est stocké par agence dans `AgencyWallet` — donc chaque agence peut avoir un taux différent négocié individuellement (défaut : 0.15 = 15%).

Ce qui se passe en même temps :
- **Driver** : son solde spendable (`balance`) est crédité de `driverShare` immédiatement (transaction type `GAIN`). C'est de l'argent qu'il peut retirer tout de suite, indépendamment du cash physique.
- **Agence** : `AgencyWallet.balance` += `agencyShare`, et une transaction `COMMISSION` est créditée dans le wallet perso de l'admin de l'agence pour info/traçabilité.
- **Platform** : `recordProfit(adminShare)` → alimente `platformProfit` (la vraie marge nette de CargoLink), et `recordRevenue(deliveryFee)` → alimente `totalRevenue` (le chiffre d'affaires brut, frais complets).

---

### 2.3 Étape 2 — Si la commande a du COD (`codCollected = true`)

Le driver collecte **physiquement** chez le destinataire : `codAmount + deliveryFee` (le cash total, frais inclus).

```
totalCashToCollect = codAmount + deliveryFee
```

Ce cash est enregistré sur le wallet du driver comme :
- `cashInHand` += totalCashToCollect  → argent physique qu'il a dans les mains
- `debtToSystem` += totalCashToCollect → dette envers le système (il doit le remettre)

⚠️ **Important** : `cashInHand`/`debtToSystem` sont **complètement séparés** du `balance` (ses gains retirables). Le driver ne peut PAS retirer le cash COD qu'il transporte — seulement ses vrais gains (`driverShare`). Tant que `debtToSystem > 0`, les retraits sont **bloqués** (vérifié dans `createWithdrawalRequest`).

---

### 2.4 Étape 3 — Le driver remet le cash à l'agence (2 façons)

**A) Déclaration manuelle** (`declareCODRemittance`)
Le driver sélectionne ses commandes COD collectées + déclare un montant total → crée une transaction `COD_REMIS` en statut `PENDING`, en attente de confirmation par l'agence.

**B) Remise par scan** (`remitAllByAgencyScan`)
Le driver scanne le QR de l'agence → tout son cash en attente (`COD_COLLECTED` `PENDING`) est automatiquement regroupé et remis en **une seule fois**, statut directement `COMPLETED` (pas besoin de confirmation manuelle agence dans ce flux).

**Confirmation agence** (`confirmCODRemittance`, pour le flux A) :
- La transaction `COD_REMIS` passe à `COMPLETED`
- `driverWallet.cashInHand` et `debtToSystem` sont réduits du montant remis (dette effacée)
- `AgencyWallet.balance` += montant remis, `totalCollected` += montant remis
- Si le driver n'a pas d'agence → l'argent va directement au `PlatformWallet` (`updateBalance`)
- Chaque commande liée passe en statut `CONFIRMED_BY_AGENCY`
- **Déclenche automatiquement** le crédit du wallet client final (`handleCustomerCodCollected`)

---

### 2.5 Étape 4 — Le client (marchand) reçoit son argent (`processClientSettlement`)

C'est **ici** que le marchand/customer récupère son argent COD :

```
netSettled = codAmount − deliveryFee
```

**Exemple** : colis avec `codAmount = 200 MAD` et `deliveryFee = 30 MAD` →
le marchand reçoit **170 MAD** net, crédité automatiquement sur son `Wallet.balance`.

- Si `deliveryFee >= codAmount` (cas rare, frais plus grand que le COD) → aucun crédit, la commande passe direct en `SETTLED_TO_CLIENT` sans transaction (log warning).
- Sinon : le wallet client est crédité de `netSettled`, transaction `COD_SETTLED` créée, et `PlatformWalletService.updateBalance(netSettled.negate())` retire ce montant du solde plateforme (car c'était une dette/liability envers le client, maintenant réglée).
- Un batch quotidien (`reconcileDailyBatch`) rattrape aussi toutes les commandes en `CONFIRMED_BY_AGENCY` pas encore réglées, pour garantir qu'aucun client n'est oublié.

> Pour les commandes **sans COD** (paiement uniquement des frais de livraison, style abonnement/prépayé) : `handleCustomerOrderPayment` **débite** directement le wallet client du montant `deliveryFee` dès la livraison, et le crédite au `PlatformWallet`.

---

### 2.6 Résumé — Qui prend quelle marge sur `deliveryFee` ?

```
                         deliveryFee (100%)
                               │
                ┌──────────────┴──────────────┐
                │                              │
          Platform (5%)                  Reste (95%)
        = marge fixe CargoLink                 │
                                  ┌─────────────┴─────────────┐
                                  │                            │
                          Agence (15% du reste)         Driver (85% du reste)
                        = commission agence            = gains driver
```

La plateforme gagne donc **toujours 5% de chaque frais de livraison**, quel que soit le reste — c'est sa marge garantie (`platformProfit`), séparée du `totalRevenue` qui lui représente 100% des frais qui transitent (utile pour la compta/cashflow, pas pour le profit réel).

Le `codAmount` (le prix du produit vendu) **ne génère aucune marge** — il transite intégralement : `codAmount → driver → agence → plateforme (temporairement, comme liability) → client (moins les frais déjà pris ailleurs)`. La plateforme ne fait que "porter" cet argent pendant le cycle, elle ne le garde jamais.

---

### 2.7 Comment le client (customer) demande son retrait (Payout)

Flow identique pour Driver / Customer / Agence, via `createWithdrawalRequest` :

1. **Montant minimum : 200 MAD** (codé en dur, vérifié en premier).
2. Vérifie qu'aucune demande n'est déjà `PENDING`/`PROCESSING` (anti double-demande).
3. Vérifie que `wallet.balance >= amount` (solde réellement disponible, pas le cash COD).
4. Si `walletType == DRIVER` et `debtToSystem > 0` → **bloqué**, doit d'abord remettre son cash.
5. Récupère le compte PayPal lié (`PaymentAccount`), sinon erreur "aucun compte PayPal vérifié".
6. **Débit immédiat** du wallet (avant même l'appel à PayPal) + transaction `PAYOUT` en `PENDING`.
7. Conversion `MAD → devise payout` via `ExchangeRateService`.
8. Appel réel à l'API PayPal (`paymentProvider.createPayout`) — hors transaction DB, pour ne pas bloquer la base pendant un appel réseau externe.
9. Résultat :
   - ✅ Succès → transaction passe en `PROCESSING`
   - ❌ Échec → transaction `FAILED`, le wallet est **remboursé automatiquement** (transaction `REFUND`), rien n'est perdu pour l'utilisateur.

Pour l'**agence**, le flow est légèrement différent (`agencyRequestPayout`) : pas d'appel PayPal automatique, juste une demande `AgencyPayoutRequest` en `PENDING` que l'**admin doit approuver manuellement** (`adminApproveAgencyPayout`) ou rejeter (`rejectAgencyPayout`, qui rembourse le solde agence).

---

## 3. Schéma Récapitulatif du Cycle Complet de l'Argent

```
1. Commande créée (deliveryFee + codAmount définis)
2. Driver livre le colis → collecte cash chez le destinataire
      cash collecté = codAmount + deliveryFee
      → driver.cashInHand ↑ , driver.debtToSystem ↑
      → driver.balance crédité de sa part de gains (driverShare) IMMÉDIATEMENT
      → agence.balance crédité de sa commission (agencyShare) IMMÉDIATEMENT
      → platform.profit crédité de 5% (adminShare) IMMÉDIATEMENT
3. Driver remet le cash physique à l'agence (déclaration ou scan)
      → driver.cashInHand ↓ , driver.debtToSystem ↓ (dette effacée)
      → agence.balance ↑ du montant total remis
4. Agence confirme réception → déclenche le règlement client
      → codAmount − deliveryFee crédité au wallet du CUSTOMER (marchand)
5. N'importe quel rôle (Driver / Agence / Customer) demande un retrait
      → min 200 MAD, solde débité immédiatement, payout PayPal déclenché
      → si échec PayPal → remboursement automatique
```

---

## 4. Recommandations UI/UX transversales (les 4 rôles)

1. **Toujours distinguer visuellement 2 notions** : *argent à moi (retirable)* vs *argent que je transporte pour quelqu'un d'autre* (surtout critique pour Driver et Agence).
2. **Un seul CTA principal par écran** — ne pas mettre "Retirer" et "Remettre" au même niveau de priorité visuelle ; l'action bloquante (rembourser une dette) doit toujours dominer visuellement l'action bloquée (retirer).
3. **Statuts en badges de couleur cohérents partout** : `PENDING` = amber, `COMPLETED`/`CONFIRMED` = vert, `FAILED`/`REJECTED` = rouge, `PROCESSING` = bleu.
4. **Un seul montant minimum affiché clairement** (200 MAD) sur tous les formulaires de retrait, pas juste dans un message d'erreur après coup.
5. **Historique des transactions** : même composant réutilisable pour les 4 rôles (liste avec icône type, montant signé +/-, description, date, badge statut) — juste le filtre de types change par rôle.