// src/utils/textCleanup.js

// Certaines données importées (probablement via un export SQL Server / XML)
// contiennent des séquences d'échappement SpreadsheetML restées non décodées
// (ex: "_x000D_" au lieu d'un vrai retour chariot). Cette fonction les
// convertit en vrais sauts de ligne / espaces pour l'affichage et l'export.
export const cleanEscapedText = (value) => {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/_x000d_/gi, '\n')   // carriage return (CR)
    .replace(/_x000a_/gi, '\n')   // line feed (LF)
    .replace(/_x0009_/gi, '\t')   // tab
    .split('\n')
    .map((line) => line.trim())   // retire les espaces en début/fin de chaque ligne
    .join('\n')
    .replace(/\n{2,}/g, '\n')     // effondre les lignes vides consécutives
    .trim();
};