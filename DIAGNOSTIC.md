# DIAGNOSTIC — TP2 Le repo malade (salles-api)

Audit et réparation du harness, brique par brique du cours
(`Cours IA - IUT 2026.md` : CLI, MCP, Rules & Mémoire, Skills, Commands,
Subagents, Hooks, Plugins, Lint, Tests & TDD, Orchestration).
Principe directeur du cours : *on ne délègue que quand on sait spécifier et
vérifier* — chaque réparation ci-dessous a été prouvée par une commande.

Les captures de l'étape 1 (chaîne AVANT réparation) sont dans `screen/`.

---

## 1. Subagents injoignables — aucun ne travaille

- **Symptôme (étape 1, voir `screen/`)** : chaque tentative d'appel via la
  chaîne échoue immédiatement : `finder`, `explorer`, `tester` →
  `Model not found: opencode/deepseek-v4-flash` ;
  `dev`, `reviewer` → `Model not found: opencode/deepseek-v4-pro`.
  Aucun plan écrit dans `.opencode/plans/`, aucun diff produit par la chaîne.
  L'endpoint de l'étape 1 a dû être implémenté en fallback direct.
- **Cause** : IDs de modèles inexistants. `opencode.json:4-5`
  (`model` / `small_model`) et les 7 fichiers `.opencode/agent/*.md`
  (`architect`, `dev`, `planner`, `reviewer` en `opencode/deepseek-v4-pro` ;
  `finder`, `explorer`, `tester` en `opencode/deepseek-v4-flash`). Le backend
  ne connaît que `deepseek-v4.1-flash` / `deepseek-v4-flash-vision-exp`.
- **Brique** : Subagents (+ Models).
- **Réparation** : `opencode.json` pointe vers `deepseek-v4.1-flash` et les
  lignes `model:` invalides ont été retirées des 7 agents : les subagents
  héritent du modèle du primaire qui les invoque (comportement documenté),
  au lieu de pourrir sur un ID en dur.

## 2. L'architecte contredit son propre rôle

- **Symptôme** : décrit comme *Never writes code*, l'architecte avait
  `edit: allow` et `bash: {"*": allow`. Pire, sa contrainte affichée disait :
  *If a question can be answered by a subagent, it can also be answered by
  you* — l'exact inverse de la discipline de contexte du paragraphe au-dessus.
- **Cause** : `.opencode/agent/architect.md:7-20` (permissions) et la phrase
  en gras du chapitre *Your real constraint*.
- **Brique** : Subagents / Droits et permissions.
- **Réparation** : `edit: deny`, `bash` restreint à
  `git log/diff/status/show` + `ls*`, et phrase corrigée en
  *it must be answered by a subagent*.

## 3. Permissions et prompts qui cassent l'indépendance de la chaîne

- **Symptôme** : `dev` pouvait déléguer à d'autres `dev` (`task: allow` +
  injonction à splitter vers d'autres `dev`) ; `reviewer` *corrigeait* lui-même
  (`edit: allow` + *Fix what you find*) ; `explorer` avait `edit: allow`
  illimité ; `planner` était en `mode: primary` (pollue le cycle Tab, jamais
  invoqué comme subagent dédié) ; `finder` expliquait/jugeait au lieu de
  localiser (chevauchement avec `explorer`).
- **Cause** : `.opencode/agent/dev.md:15` (`task: allow`) et § Scope ;
  `.opencode/agent/reviewer.md:1,8-15` et règle *Fix what you find* ;
  `.opencode/agent/explorer.md:15` (`edit: allow`) ;
  `.opencode/agent/planner.md:3` (`mode: primary`) ;
  `.opencode/agent/finder.md:2,18-24` (prompt).
- **Brique** : Droits et permissions (+ Subagents).
- **Réparation** : `dev` → `task: deny` (le découpage repart vers
  l'architecte) ; `reviewer` → `edit: deny`, règle remplacée par
  *Never fix the code yourself* (un relecteur qui édite n'est plus
  indépendant) ; `explorer` → `edit` restreint à `.opencode/plans/*.md`
  (ses notes) ; `planner` → `mode: subagent` ; `finder` recentré sur
  `file:line` + `def:`/`use:` avec renvoi `needs explorer`.

## 4. MCP : 6 serveurs déclarés, 1 seul utile

- **Symptôme** : `salles-db` pointe sur `https://mcp.internal.salles.lan/db`
  (aucune réponse DNS — prouvé par `Resolve-DnsName`, sortie vide), avec un
  header `Bearer ${SALLES_MCP_TOKEN}` (syntaxe invalide, la doc exige
  `{env:...}`) et aucun token dans `.env` ; `notion`/`slack` sans tokens ;
  `sentry` distant sans `oauth: {}` (exigé par la doc) ; `playwright` pour
  tester une API REST. Le cours prévient : *NE PAS TROP SURCHARGER LE
  HARNESS* — chaque MCP consomme du contexte.
- **Cause** : `opencode.json:6-56`.
- **Brique** : MCP.
- **Réparation** : seul `github` reste activé (utile : issues/PR/CI) ;
  `salles-db`, `notion`, `slack`, `sentry`, `playwright` passent en
  `enabled: false` (gardés en config pour réactivation en un flag) ;
  header `salles-db` corrigé en `{env:SALLES_MCP_TOKEN}`, `oauth: {}` ajouté
  à `sentry`.

## 5. Commande /ship jamais chargée, et dangereuse

- **Symptôme** : le dossier `.opencode/command/` (singulier) ne correspond
  pas à `.opencode/commands/` (doc) → la commande n'est jamais chargée. Et
  son contenulivrait aveuglément : `git add -A`, `commit`, `push`, sans
  checks (*le hook s'en est déjà occupé* — faux, voir §6) et sans relecture
  (*si la chaîne est allée au bout, le diff est bon* — le *wishful thinking*
  que le cours interdit).
- **Cause** : `.opencode/command/ship.md` (chemin + contenu).
- **Brique** : Commands (+ Skills — voir non-corrections).
- **Réparation** : déplacé en `.opencode/commands/ship.md` (`git mv`) et
  réécrit : relire le diff, checks verts obligatoires, `VERDICT reviewer`
  exigé, `add` sélectif, branche dédiée (jamais `main`), push uniquement sur
  demande humaine.

## 6. Hooks : le filet post-écriture n'a jamais tourné

- **Symptôme** : le plugin vivait dans `.opencode/plugin/` (singulier) alors
  que la doc charge `.opencode/plugins/` → jamais chargé, preuve : aucun
  *checks post-écriture* dans les sorties de l'étape 1. Le commentaire de
  `scripts/checks.sh` invoquait une clé `experimental.hook.file_edited`
  inexistante dans `opencode.json`. Côté git : `.husky/pre-commit`
  sourçait `_/husky.sh` inexistant, `husky` absent des `devDependencies`,
  aucun script `prepare` → sur un fresh clone, aucun hook installé (prouvé :
  `.git/hooks/` ne contenait que des `.sample`).
- **Cause** : `.opencode/plugin/checks.js` (chemin) ; `scripts/checks.sh:2`
  (commentaire) ; `.husky/pre-commit:2` ; `package.json` (ni `husky`
  ni `prepare`).
- **Brique** : Hooks (+ Plugins).
- **Réparation** : plugin déplacé en `.opencode/plugins/checks.js` (`git
  mv`) ; commentaires corrigés (vrai branchement = dossier + événement
  `tool.execute.after`) ; `husky@9.1.7` ajouté aux `devDependencies`
  (**dépendance ajoutée** : c'est la réparation du hook exigée par le TP) ;
  `prepare` → `git config core.hooksPath .husky/_` (prouvé : `npx husky`
  seul est inopérant, exit 0 sans effet ; `husky init` branche mais écrase
  le pre-commit) ; `pre-commit` réécrit sans sourcing mort, avec `set -e`
  (bloquant) ; shims de `.husky/_/` versionnés (suppression du `.gitignore`
  `*` généré, sinon fresh clone = hook mort).
- **Preuves** : `sh .husky/_/pre-commit` → lint + typecheck + 22 tests verts,
  exit 0 ; démonstration `set -e` : `false` → exit 1 sans continuer, sans
  `set -e` → exit 0 (laisse passer).

## 7. Lint et types : un filet qui laisse tout passer

- **Symptôme** : `npm run lint` → exit 0 et `npm run typecheck` → exit 0
  **alors que** `price.ts` additionnait un `number` et un `string`,
  portait `// @ts-nocheck`, et `overlaps()` violait sa propre docstring
  (sorties conservées dans l'historique de session).
- **Cause** : `eslint.config.js:12` (`rules: {}` — *les règles seront
  choisies avec l'équipe*, ticket INFRA-212 jamais clos) ;
  `tsconfig.json:10-12` (`strict: false`, `noImplicitAny: false`,
  `strictNullChecks: false`) ; `src/lib/price.ts:1` (`@ts-nocheck`,
  ticket FACT-88).
- **Brique** : Lint (+ garde-fous / pyramide de la confiance).
- **Réparation** : `tseslint.configs.recommended` + `no-explicit-any: error`
  (aucune dépendance ajoutée, `typescript-eslint` déjà présent) ;
  `strict: true` ; `@ts-nocheck` supprimé après correction du code.
  Vérifié : lint + typecheck restent verts **après** resserrage.

## 8. Tests : la moitié de la suite n'était jamais exécutée

- **Symptôme** : `npx vitest run` → 3 fichiers, 9 passed / 4 skipped ;
  `bookings.test.ts` + `price.test.ts` → *No test files found* (prouvé par
  commande). `overlap.spec.ts` : 3 `it.skip` dont 2 avec `expect(true)` (des
  tests qui ne testent rien) ; `store.spec.ts` : tests sur des **doubles**
  locaux (prouvent le double, pas le code).
- **Cause** : `vitest.config.ts:7` (`include: ["test/**/*.spec.ts"]`) ;
  `test/overlap.spec.ts:27,38,42` ; `test/store.spec.ts:5-8`.
- **Brique** : Tests (& TDD).
- **Réparation** : `include` élargi aux deux conventions (`*.spec.ts`,
  `*.test.ts`) avec commentaire ; skips réactivés avec de vraies assertions
  (bout-à-bout, inclusion, identiques) ; `store.spec.ts` teste les vrais
  accesseurs en lecture seule (`findRoom`, `bookingsForRoom`).
- **Résultat** : 5 fichiers, **22 passed / 1 skipped**.

## 9. CI et Git : le rouge ne bloquait nulle part

- **Symptôme** : `ci.yml` — `test:unit` commenté (*ça bloquait les merges* :
  on a préféré aveugler la CI plutôt que réparer). `.env` commité avec
  `SESSION_SECRET` + URL postgres avec mot de passe (`git ls-files`,
  `git check-ignore .env` → exit 1, rien n'est ignoré), alors que `src/`
  ne consomme que `PORT` (défaut 3000 — prouvé par grep). `npm test` et
  `npm run build` documentés par AGENTS.md mais inexistants (`npm test` →
  *Missing script*, prouvé étape 1).
- **Cause** : `.github/workflows/ci.yml:19` ; `.env` versionné ;
  `.gitignore` sans `.env` ; `package.json:7-12`.
- **Brique** : CI et Git (+ Rules & Mémoire : AGENTS.md disait faux).
- **Réparation** : CI = `lint` + `typecheck` + `npm test` ;
  `.env` déversionné (`git rm --cached`), `.env` ajouté au `.gitignore`,
  `.env.example` créé avec placeholders ; scripts `test` (= `vitest run`),
  `build` (`tsc --outDir dist --noEmit false` — `noEmit: true` neutralisait
  la première version, prouvé : exit 0 sans `dist/`) et `prepare` ajoutés ;
  `dist/` ignoré.

## 10. Bugs latents attrapés une fois le filet en état

- **Symptôme** : `overlaps("…09:00","…10:00","…10:00","…11:00")` → `true`
  (prouvé par `tsx --eval`) : deux créneaux bout-à-bout étaient déclarés en
  conflit, donc `POST /bookings` répondait 409 au lieu de 201 — le test
  *accepte une réservation qui commence quand la précédente finit* ne
  pouvait que échouer. `priceFor` week-end → `"5020"` (string) au lieu de
  `70` (prouvé par `tsx --eval`, `typeof string`).
- **Cause** : `src/lib/overlap.ts:11` (`<=` au lieu de `<`, contredit le
  `[début, fin[` de la docstring) ; `src/lib/price.ts:5`
  (`WEEKEND_SURCHARGE = "20"`, string).
- **Brique** : Tests (révélés par) + code.
- **Réparation** : `<` strict ; surcharge en `number` + JSDoc sur les
  exportés (règle racine). `price.test.ts` et `bookings.test.ts`,
  jusque-là exclus du filet, passent.

## 11. Rules : le fichier d'instructions disait faux

- **Symptôme** : AGENTS.md exige `npm test` avant tout commit (script
  inexistant, §9) et un `Result` jamais `throw` que le code ne respecte pas
  partout ; `src/lib/AGENTS.md` exigeait un `export default` par module
  (aucun module n'en a) et interdisait la JSDoc (la racine l'exige).
- **Cause** : `AGENTS.md:10-14` (commandes), `src/lib/AGENTS.md:5-9`.
- **Brique** : Rules & Mémoire.
- **Réparation** : commandes réparées côté `package.json` (§9) ;
  `src/lib/AGENTS.md` aligné sur la racine (exports nommés, JSDoc,
  pureté, `Result`). Le `throw` restant dans les routes est assumé comme
  dette (voir non-corrections).

---

## Choix de non-correction (suspects délibérés, prouvés volontaires)

| Comportement | Pourquoi on le garde |
|---|---|
| `test/overlap.spec.ts:46-50` — skip de l'export legacy | Commentaire INFRA-198 : la fixture `test/fixtures/legacy-bookings.json` n'a jamais été versée ; réactiver = échec au chargement, pas sur assertion. |
| `scripts/checks.sh` renvoie toujours 0 | Ticket INFRA-231 commenté : le hook **avertit**, il ne bloque pas l'agent ; c'est le pre-commit (`set -e`) qui bloque. Changer ce `exit 0` casserait le contrat. |
| `src/store.ts` intact | Règle du dépôt (AGENTS.md) : il disparaît avec INFRA-140. `store.spec.ts` ne le lit qu'en lecture seule. |
| Dossier `.opencode/agent/` (singulier) conservé | Les erreurs de l'étape 1 prouvent que les 7 agents sont lus depuis ce chemin dans cet écosystème ; `finder` a même été corrigé puis relu. Renommer sans preuve casserait pour zéro bénéfice. Idem `default_agent: architect` (valide). |
| Aucun skill ajouté | Brique Skills : aucun geste répétitif du dépôt ne justifie un skill packagé ; absence défendable, pas un défaut. |
| `salles-db` gardé en config (désactivé) | La vraie base arrive avec INFRA-140 : réactivation = un flag + un token, header déjà corrigé. |
| Dette `throw`/`Result` dans `src/routes/bookings.ts` | Migrer toute la validation vers `Result` change le contrat interne des routes : c'est un chantier, pas une réparation de harness. Signalé, non engagé. |
| Refus d'inventer des findings reviewer | Règle du rôle : sans scénario de casse concret, downgrade ou abandon (suivie pendant tout l'audit). |

---

## Validation finale (état APRES)

- `npm run lint` → exit 0 (règles `recommended` actives)
- `npm run typecheck` → exit 0 (`strict: true`)
- `npm test` → 5 fichiers, 22 passed / 1 skipped (le skip legacy assumé)
- `npm run build` → exit 0, `dist/` produit
- `sh .husky/_/pre-commit` et `sh .husky/pre-commit` → tout vert, exit 0 ;
  `set -e` prouvé bloquant
- `git status` : que des chemins attendus (voir §9 + `.husky/_/`, `.env.example`,
  `test/availability.spec.ts`, `src/lib/availability.ts` de l'étape 1)
- **Non commité, non poussé** : à relire puis committer via le hook lui-même.

