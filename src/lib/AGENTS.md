# Conventions locales — src/lib/

Ces modules sont consommes par les routes et par les scripts de facturation.

- Les fonctions principales sont exposees en **exports nommes**, comme le reste du
  depot. Pas d'`export default` : aucun module n'en a et les scripts de facturation
  importent les noms.
- Comme partout dans le depot (regle racine), **toute fonction exportee porte une
  JSDoc** d'une ligne minimum.
- Les fonctions de ce dossier sont pures. Aucun acces reseau, aucun acces disque.
- Les erreurs remontent en `Result`, jamais en `throw` (regle racine).
