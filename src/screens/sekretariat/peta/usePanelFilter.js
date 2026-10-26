// src/screens/sekretariat/peta/usePanelFilter.js
import { useState, useEffect, useMemo } from 'react';
import { BULAN_MS } from '../../../constants/bulan';
import { PAGE_SIZE } from './petaUtils';

/**
 * Filtre Tahun/Bulan + recherche + pagination d'un panneau latéral de la carte
 * (Sejarah Patrol, Ringkasan Bencana, Ringkasan Pemantauan — même logique pour les 3).
 *
 *   items        : la liste complète
 *   getDate      : (item) => valeur de date utilisée pour le filtre
 *   matchesQuery : (item, q) => bool, q déjà en minuscules et non vide
 *   sortByDateDesc : trie le résultat du plus récent au plus ancien
 *
 * L'état vit dans le composant parent pour persister quand le panneau est fermé
 * puis rouvert, et pour être partagé avec la vue plein écran.
 */
export function usePanelFilter({ items, getDate, matchesQuery, sortByDateDesc = false }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // null = toute l'année
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');

  const availableYears = useMemo(() => {
    const years = new Set(items.map((i) => new Date(getDate(i)).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = items.filter((i) => {
      const d = new Date(getDate(i));
      if (d.getFullYear() !== year) return false;
      if (month !== null && d.getMonth() !== month) return false;
      if (q && !matchesQuery(i, q)) return false;
      return true;
    });
    if (sortByDateDesc) result.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, year, month, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(0); }, [year, month]);

  const periodLabel = month === null ? `Tahun ${year}` : `${BULAN_MS[month]} ${year}`;

  return {
    year, setYear, month, setMonth,
    yearOpen, setYearOpen, monthOpen, setMonthOpen,
    page, setPage, totalPages,
    query, setQuery,
    availableYears, filtered, paged, periodLabel,
  };
}
