# Échelle typographique — SediaOps (thème "soft orange")

Résumé des tailles de police harmonisées sur HomeScreen, et où les réutiliser.

## Échelle

| Rôle | Taille | Poids | Usage |
|---|---|---|---|
| Titre principal (H1) | 22px | 900 | Titre de page / hero |
| Titre de carte (H2) | 16px | 800 | Nom d'organisation / titre de section dans une carte |
| Label / overline | 12px | 800–900, uppercase | Petit texte d'en-tête au-dessus d'un bloc (ex. "ALAMAT PEJABAT APM LABUAN") |
| Corps de texte | 14px | 500–700 | Paragraphes, adresses, contacts, sous-titres |

Règle simple : 4 tailles seulement (22 / 16 / 14 / 12). Ne pas introduire de taille intermédiaire (13, 15, 17...) sauf besoin explicite — c'est ce qui cassait l'harmonie avant.

`lineHeight` ≈ taille × 1.4 à 1.5 dans tous les cas (ex. 14px → 21px, 16px → 22-23px, 22px → 28px).

## Couleurs de texte associées

- Texte principal : `PALETTE.textDark`
- Texte secondaire / muted : `PALETTE.textMutedDark`
- Label/accent : couleur d'accent de la section (`PALETTE.orange`, `PALETTE.blue`, ou variable `accent` locale)

## Fichiers sources (référence exacte)

Si tu veux répliquer ce style ailleurs, regarde ces fichiers comme modèle — les valeurs `fontSize`/`lineHeight`/`fontWeight` y sont déjà à jour :

- `src/screens/home/HeroSection.js` → styles `kicker` (label), `title` (H1), `subtitle` (corps)
- `src/screens/home/InfoWidgets.js` → styles `label` (label), `body` (corps)
- `src/screens/home/AddressWidgets.js` → styles `label` (label), `orgTitle` (H2), `addressLine`/`contactText` (corps)
- `src/constants/palette.js` → toutes les couleurs (`textDark`, `textMutedDark`, `orange`, `blue`, `cardLight`, `cardLightBorder`, etc.)

## Pour appliquer ça à une nouvelle page

1. Importer `PALETTE` depuis `src/constants/palette.js`.
2. Copier le pattern de `AddressWidgets.js` si la page a des "cartes" avec label + titre + corps.
3. Copier le pattern de `HeroSection.js` si la page a un titre principal en haut.
4. Garder strictement les 4 tailles ci-dessus — ne pas en inventer de nouvelles.
