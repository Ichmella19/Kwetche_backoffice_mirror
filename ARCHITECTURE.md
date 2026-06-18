# Architecture Clean du Back-office Kwetche

Ce projet suit une architecture clean adaptée à Next.js : les pages restent dans `app/`, mais la logique métier, les appels API, les types, les constantes et les composants sont rangés dans `src/`.

L'objectif est simple : chaque module garde ses fichiers dans son dossier, comme dans `terral_api`, et les couches ne se mélangent pas.

## Vue d'ensemble

```txt
app/
  (auth)/
  (dashboard)/

src/
  core/
    domain/
      repositories/
    data/
      repositories/
      http.service.ts

  presentation/
    services/
    components/
    contexts/
    hooks/

  lib/
    constants/
    enums/
    types/
    utils/
```

## Rôle des couches

### `app/`

Contient uniquement les routes Next.js et les layouts.

Une page peut :
- afficher l'interface ;
- appeler un service de `src/presentation/services/*` ;
- utiliser des composants ;
- utiliser des hooks/contexts.

Une page ne doit pas contenir directement :
- des appels HTTP ;
- des règles métier longues ;
- des URLs API codées en dur ;
- des traitements réutilisables.

Exemple :

```ts
import { kycService } from "@/presentation/services/kyc";
```

### `src/core/domain`

Contient les contrats métier abstraits.

Aujourd'hui, on y met surtout les interfaces de repositories :

```txt
src/core/domain/repositories/
  auth/
    auth.repository.ts
    index.ts
  kyc/
    kyc.repository.ts
    index.ts
```

Cette couche décrit ce dont l'application a besoin, sans savoir comment l'API répond.

Exemple :

```ts
export interface IKycRepository {
  listPending(level?: number): Promise<KycDocument[]>;
  approve(documentId: string): Promise<KycDocument>;
  reject(documentId: string, reason: string): Promise<KycDocument>;
}
```

### `src/core/data`

Contient les implémentations techniques.

Ici vivent :
- `http.service.ts` : client HTTP commun ;
- `repositories/*` : classes qui appellent l'API.

Exemple :

```txt
src/core/data/repositories/kyc/
  kyc.repository.impl.ts
  index.ts
```

Le repository traduit les méthodes métier en endpoints API :

```ts
return httpService.get<KycDocument[]>("/admin/kyc/pending");
```

### `src/presentation`

Contient ce qui sert directement l'interface.

```txt
src/presentation/
  services/
  components/
  contexts/
  hooks/
```

Les services de présentation sont les cas d'usage du front. Ils orchestrent les repositories, appliquent de petites règles UI/métier, puis renvoient des données prêtes à utiliser par les pages.

Exemple :

```txt
src/presentation/services/settings/
  settings.service.ts
  index.ts
```

### `src/lib`

Contient les éléments partagés et stables :

```txt
src/lib/
  constants/
  enums/
  types/
  utils/
```

Règle :
- `types/` : formes des données ;
- `enums/` : valeurs métier fermées ;
- `constants/` : routes, labels, stockage, API, validation ;
- `utils/` : helpers purs et réutilisables.

## Flux de dépendances

Le flux doit rester dans ce sens :

```txt
app
  -> presentation
    -> core/data
      -> core/domain
    -> lib
  -> lib
```

À éviter :

```txt
core -> presentation
lib -> presentation
lib -> app
```

`core` ne doit jamais importer un composant React, un hook, un context ou une page Next.

## Structure d'un module

Quand on ajoute un module, par exemple `tontine`, on crée les fichiers dans chaque couche utile.

```txt
src/lib/types/tontine/
  tontine.ts
  index.ts

src/lib/enums/tontine/
  tontine-status.ts

src/lib/constants/labels/
  tontine.ts

src/core/domain/repositories/tontine/
  tontine.repository.ts
  index.ts

src/core/data/repositories/tontine/
  tontine.repository.impl.ts
  index.ts

src/presentation/services/tontine/
  tontine.service.ts
  index.ts

src/presentation/components/tontine/
  ...

app/(dashboard)/tontines/
  page.tsx
```

Tous les dossiers exposent un `index.ts` pour garder des imports courts :

```ts
import { tontineService } from "@/presentation/services/tontine";
import type { Tontine } from "@/lib/types";
```

## Convention de nommage

Pour garder le projet lisible :

- repository contrat : `*.repository.ts`
- repository implémentation : `*.repository.impl.ts`
- service front : `*.service.ts`
- type principal : nom métier, ex. `tontine.ts`
- composants React : kebab-case, ex. `tontine-card.tsx`
- dossier de module : singulier ou nom métier stable, ex. `kyc`, `auth`, `settings`

## Exemple complet : KYC

```txt
src/lib/types/kyc/
  kyc-document.ts
  index.ts

src/lib/enums/kyc/
  document-type.ts

src/core/domain/repositories/kyc/
  kyc.repository.ts
  index.ts

src/core/data/repositories/kyc/
  kyc.repository.impl.ts
  index.ts

src/presentation/services/kyc/
  kyc.service.ts
  index.ts

src/presentation/components/kyc/
  kyc-document-card.tsx
  kyc-level-badge.tsx
  kyc-status-badge.tsx
```

La page `app/(dashboard)/kyc/page.tsx` ne connaît pas les détails HTTP. Elle appelle seulement :

```ts
import { kycService } from "@/presentation/services/kyc";
```

## Barrels `index.ts`

Les barrels servent à exposer proprement un dossier.

Exemple :

```ts
// src/presentation/services/kyc/index.ts
export { kycService } from "./kyc.service";
```

On évite d'importer directement les fichiers profonds depuis les pages quand un barrel existe.

Préféré :

```ts
import { kycService } from "@/presentation/services/kyc";
```

À éviter :

```ts
import { kycService } from "@/presentation/services/kyc/kyc.service";
```

## Règles pratiques

1. Une page affiche, un service orchestre, un repository appelle l'API.
2. Les types et enums restent dans `src/lib`.
3. Les labels d'affichage restent dans `src/lib/constants/labels`.
4. Les endpoints API restent dans les repositories.
5. Les composants ne font pas d'appels HTTP directs.
6. Les contexts servent à l'état global UI/session, pas à remplacer les services.
7. Si un fichier devient trop gros, on crée un dossier de module et un `index.ts`.

## Checklist pour ajouter un nouveau module

1. Créer les types dans `src/lib/types/<module>/`.
2. Ajouter les enums nécessaires dans `src/lib/enums/<module>/`.
3. Ajouter les labels dans `src/lib/constants/labels/` si l'UI en a besoin.
4. Créer le contrat dans `src/core/domain/repositories/<module>/`.
5. Créer l'implémentation API dans `src/core/data/repositories/<module>/`.
6. Exporter le repository dans `src/core/data/repositories/index.ts`.
7. Créer le service dans `src/presentation/services/<module>/`.
8. Créer les composants dans `src/presentation/components/<module>/`.
9. Créer la page dans `app/(dashboard)/<route>/page.tsx`.
10. Lancer TypeScript et ESLint.

Commandes de vérification :

```bash
pnpm type-check
pnpm lint
```

Si `pnpm` n'est pas disponible dans le shell :

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint .
```
