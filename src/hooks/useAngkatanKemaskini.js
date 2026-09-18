// src/hooks/useAngkatanKemaskini.js
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { syncApprovedRowToExcel } from '../utils/excelRowSync';

// Colonnes de staging à exclure quand on pousse vers angkatan_employees
const STAGING_ONLY_KEYS = ['id', 'matching_employee_id', 'is_new_entry', 'review_status', 'reviewed_by', 'reviewed_at', 'admin_notes', 'submitted_at', 'updated_at', 'created_at', '_existingSnapshot'];

export function useAngkatanKemaskini() {
  const [pendingList, setPendingList] = useState([]);
  const [loadingKemaskini, setLoadingKemaskini] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoadingKemaskini(true);
    const { data, error } = await supabaseSandbox
      .from('angkatan_kemaskini')
      .select('*')
      .eq('review_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      setPendingList([]);
      setLoadingKemaskini(false);
      return;
    }

    const entries = data || [];
    const matchingIds = [...new Set(entries.filter((e) => e.matching_employee_id).map((e) => e.matching_employee_id))];

    let snapshotsById = {};
    if (matchingIds.length > 0) {
      const { data: existingRows } = await supabaseSandbox
        .from('angkatan_employees')
        .select('*')
        .in('id', matchingIds);
      snapshotsById = Object.fromEntries((existingRows || []).map((row) => [row.id, row]));
    }

    setPendingList(entries.map((e) => ({
      ...e,
      _existingSnapshot: e.matching_employee_id ? snapshotsById[e.matching_employee_id] || null : null,
    })));
    setLoadingKemaskini(false);
  }, []);

  useEffect(() => {
    fetchPending();
    const subscription = supabaseSandbox
      .channel(`angkatan_kemaskini_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'angkatan_kemaskini' }, () => {
        fetchPending();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
  }, [fetchPending]);

  const approveEntry = async (entry) => {
    setProcessingId(entry.id);
    try {
      const payload = {};
      Object.keys(entry).forEach((k) => {
        if (!STAGING_ONLY_KEYS.includes(k)) payload[k] = entry[k] === '' ? null : entry[k];
      });

      let error;
      if (entry.matching_employee_id) {
        ({ error } = await supabaseSandbox.from('angkatan_employees').update(payload).eq('id', entry.matching_employee_id));
      } else {
        ({ error } = await supabaseSandbox.from('angkatan_employees').insert([payload]));
      }
      if (error) throw error;

      // Synchro Excel uniquement pour un anggota déjà existant (une ligne à
      // modifier dans le fichier) — un nouveau rekod reste seulement en base
      // tant qu'un vrai réimport Excel n'est pas fait (pas d'insertion de
      // ligne, trop risqué avec les fusions/formules).
      if (entry.matching_employee_id) {
        await syncApprovedRowToExcel(entry.ic_no, payload);
      }

      const { error: statusError } = await supabaseSandbox
        .from('angkatan_kemaskini')
        .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', entry.id);
      if (statusError) throw statusError;

      await fetchPending();
      return true;
    } catch (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const rejectEntry = async (id, notes) => {
    setProcessingId(id);
    const { error } = await supabaseSandbox
      .from('angkatan_kemaskini')
      .update({ review_status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: notes || null })
      .eq('id', id);
    setProcessingId(null);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : Alert.alert('Ralat', error.message);
      return false;
    }
    await fetchPending();
    return true;
  };

  return { pendingList, loadingKemaskini, processingId, approveEntry, rejectEntry, fetchPending };
}