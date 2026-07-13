// src/hooks/useNg999Report.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { CATEGORY_OPTIONS, getCategoryColor } from '../constants/operasiConstants';
import { BULAN_MS } from '../constants/bulan';

export function useNg999Report(filterYear, filterMonth) {
  const [ngData, setNgData] = useState([]);
  const [allNgData, setAllNgData] = useState([]); // pour stats globales
  const [loadingNg, setLoadingNg] = useState(false);

  // Fetch filtré par année/mois pour le tableau Senarai
  const fetchNgData = useCallback(async () => {
    if (!filterYear || filterMonth === undefined) return;
    setLoadingNg(true);

    const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
    const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${new Date(filterYear, filterMonth + 1, 0).getDate()}`;

    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('*, ng999_photos(id, photo_url)')
      .gte('tarikh', startDate)
      .lte('tarikh', endDate)
      .order('tarikh', { ascending: false });

    if (data) setNgData(data);
    if (error) console.error("Error fetching NG999 data:", error);
    setLoadingNg(false);
  }, [filterYear, filterMonth]);

  // Fetch global pour stats (totalMersCases, topCaseData, availableYears)
  const fetchAllNgData = useCallback(async () => {
    const { data, error } = await supabaseSandbox
      .from('laporan_ng999')
      .select('id, tarikh, kategori_kes, jumlah_kes')
      .order('tarikh', { ascending: false });
    if (data) setAllNgData(data);
    if (error) console.error("Error fetching all NG999 data:", error);
  }, []);

  useEffect(() => {
    fetchAllNgData();
    fetchNgData();

    const sub1 = supabaseSandbox
      .channel('laporan_ng999_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'laporan_ng999' }, () => {
        fetchNgData();
        fetchAllNgData();
      })
      .subscribe();
    const sub2 = supabaseSandbox
      .channel('ng999_photos_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'ng999_photos' }, fetchNgData)
      .subscribe();

    return () => {
      supabaseSandbox.removeChannel(sub1);
      supabaseSandbox.removeChannel(sub2);
    };
  }, [fetchNgData, fetchAllNgData]);

  const uploadPhoto = useCallback(async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseSandbox.storage
      .from('ng999-photos')
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (error) return { url: null, error };
    const { data } = supabaseSandbox.storage.from('ng999-photos').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  }, []);

  const deletePhoto = useCallback(async (photoId, photoUrl) => {
    if (photoUrl) {
      const fileName = photoUrl.split('/').pop();
      await supabaseSandbox.storage.from('ng999-photos').remove([fileName]);
    }
    await supabaseSandbox.from('ng999_photos').delete().eq('id', photoId);
    await fetchNgData();
  }, [fetchNgData]);

  const saveRecord = useCallback(async ({ id, kategori_kes, tarikh, jumlah_kes }) => {
    setLoadingNg(true);
    let error, recordId = id;
    if (id) {
      ({ error } = await supabaseSandbox
        .from('laporan_ng999')
        .update({ kategori_kes, tarikh, jumlah_kes })
        .eq('id', id));
    } else {
      const { data, error: insertError } = await supabaseSandbox
        .from('laporan_ng999')
        .insert([{ kategori_kes, tarikh, jumlah_kes }])
        .select('id')
        .single();
      error = insertError;
      if (data) recordId = data.id;
    }
    if (!error) { await fetchNgData(); await fetchAllNgData(); }
    setLoadingNg(false);
    return { error, recordId };
  }, [fetchNgData, fetchAllNgData]);

  const addPhotosToRecord = useCallback(async (laporan_id, files) => {
    const urls = [];
    for (const file of files) {
      const { url, error } = await uploadPhoto(file);
      if (!error && url) urls.push(url);
    }
    if (urls.length > 0) {
      const { error } = await supabaseSandbox.from('ng999_photos').insert(
        urls.map(photo_url => ({ laporan_id, photo_url }))
      );
      if (error) console.error('Error inserting photos:', error);
    }
    await fetchNgData();
    return urls;
  }, [uploadPhoto, fetchNgData]);

  const deleteRecord = useCallback(async (id) => {
    setLoadingNg(true);
    const record = ngData.find(r => r.id === id);
    if (record?.ng999_photos?.length > 0) {
      const fileNames = record.ng999_photos.map(p => p.photo_url.split('/').pop());
      await supabaseSandbox.storage.from('ng999-photos').remove(fileNames);
    }
    const { error } = await supabaseSandbox.from('laporan_ng999').delete().eq('id', id);
    if (!error) { await fetchNgData(); await fetchAllNgData(); }
    setLoadingNg(false);
    return { error };
  }, [fetchNgData, fetchAllNgData, ngData]);

  const categories = useMemo(() => CATEGORY_OPTIONS.map(opt => {
    const [id, ...labelArr] = opt.split(" - ");
    return { id, label: labelArr.join(" - "), color: getCategoryColor(id), fullOption: opt };
  }), []);

  const availableYears = useMemo(() => {
    const years = new Set(allNgData.map(item => new Date(item.tarikh).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allNgData]);

  const { totalMersCases, topCaseData } = useMemo(() => {
    const total = allNgData.reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
    let maxCount = 0;
    let topLabel = 'No Data Available';
    categories.forEach(cat => {
      const count = allNgData
        .filter(item => item.kategori_kes === cat.fullOption)
        .reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      if (count > maxCount) { maxCount = count; topLabel = cat.label; }
    });
    return { totalMersCases: total, topCaseData: { label: topLabel, total: maxCount } };
  }, [allNgData, categories]);

  const getTrend = useCallback((year, month) => {
    if (month === null) {
      return BULAN_MS.map((label, m) => {
        const counts = {};
        let total = 0;
        categories.forEach(cat => { counts[cat.id] = 0; });
        allNgData.forEach(item => {
          const d = new Date(item.tarikh);
          if (d.getFullYear() !== year || d.getMonth() !== m) return;
          const cat = categories.find(c => c.fullOption === item.kategori_kes);
          if (cat) { counts[cat.id] += (item.jumlah_kes || 1); total += (item.jumlah_kes || 1); }
        });
        return { label, counts, total };
      });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const counts = {};
      let total = 0;
      categories.forEach(cat => { counts[cat.id] = 0; });
      allNgData.forEach(item => {
        const d = new Date(item.tarikh);
        if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return;
        const cat = categories.find(c => c.fullOption === item.kategori_kes);
        if (cat) { counts[cat.id] += (item.jumlah_kes || 1); total += (item.jumlah_kes || 1); }
      });
      return { label: String(day), counts, total };
    });
  }, [allNgData, categories]);

  return {
    ngData, loadingNg, saveRecord, deleteRecord, uploadPhoto, deletePhoto,
    addPhotosToRecord, categories, availableYears, totalMersCases, topCaseData, getTrend,
  };
}
