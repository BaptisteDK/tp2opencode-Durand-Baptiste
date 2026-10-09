---
description: Livre le travail en cours
agent: architect
---

Le travail est termine. Livre-le proprement, sans court-circuiter le filet :

1. `git status --short` puis `git diff --stat` : relis ce que tu embarques.
2. `npm run typecheck`, `npm run lint`, `npm test` : tout doit etre vert.
   Si un check est rouge, stop — tu corriges, tu ne livres pas.
3. Demande une relecture `reviewer` du diff (`VERDICT` attendu).
4. `git add` uniquement les fichiers revus (jamais `git add -A` aveugle).
5. `git commit` sur une branche dediee (jamais directement dans `main`).
6. Ne `push` que sur demande explicite de l'humain, vers la branche dediee.

Ne saute jamais les checks : le hook post-ecriture avertit, il ne bloque pas
(tiquet INFRA-231). Ne considere jamais qu'un diff est bon sans `VERDICT` explicite.
