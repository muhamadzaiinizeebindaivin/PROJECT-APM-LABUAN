import { useMemo } from 'react';
import { useSectionBudget } from './useSectionBudget';
import { KEWANGAN_BUDGET } from '../../data';
import { parseCurrency } from '../utils/currency';
import { useKewanganLinkedSources } from './useKewanganLinkedSources';


// Applique aux lignes liées (colonne `sumber`) les montants venant des autres pages.
//   linkedFrom : page d'où vient le montant (ligne non modifiable dans Kewangan)
//   isJumlah   : ligne "total" (somme des lignes liées de la même catégorie),
//                exclue des totaux pour ne pas compter deux fois
//   breakdown  : détail affiché sous la ligne (Latihan : Elaun / Sajian)
function applyLinkedSources(rows, s) {
  const linked = rows.map((item) => {
    switch (item.sumber) {
      case 'latihan':
        return {
          ...item,
          agihan: s.latihanElaun.agihan + s.latihanSajian.agihan,
          belanja: s.latihanElaun.belanja + s.latihanSajian.belanja,
          linkedFrom: 'Latihan',
          breakdown: [
            { label: 'Elaun Latihan', ...s.latihanElaun },
            { label: 'Sajian', ...s.latihanSajian },
          ],
        };
      case 'myaspa_o':
        return { ...item, agihan: s.myaspaO.agihan, belanja: s.myaspaO.belanja, linkedFrom: 'Operasi' };
      case 'myaspa_p':
        return { ...item, agihan: s.myaspaP.agihan, belanja: s.myaspaP.belanja, linkedFrom: 'Angkatan' };
      default:
        return item;
    }
  });

  return linked.map((item) => {
    if (item.sumber !== 'jumlah_elaun') return item;
    const parts = linked.filter((r) => r.kategori === item.kategori && r.linkedFrom);
    return {
      ...item,
      agihan: parts.reduce((sum, r) => sum + parseCurrency(r.agihan), 0),
      belanja: parts.reduce((sum, r) => sum + parseCurrency(r.belanja), 0),
      isJumlah: true,
    };
  });
}

export function useKewanganBudget() {
  const linkedSources = useKewanganLinkedSources();
  const budget = useSectionBudget('kewangan_budget', { fallback: KEWANGAN_BUDGET });
  const budgetData = useMemo(() => applyLinkedSources(budget.budgetData, linkedSources), [budget.budgetData, linkedSources]);

  return { ...budget, budgetData };
}
