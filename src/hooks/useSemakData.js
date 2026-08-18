// src/hooks/useSemakData.js
import { useState } from 'react';
import { Platform } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { emptyEmployeeForm, formatICNumber, ALL_FIELDS } from '../screens/angkatan/employeeFieldGroups';

// Accepte un client Supabase optionnel : par défaut le client partagé de
// l'app, mais KemaskiniDataPage.js lui passe explicitement un client isolé
// (session de connexion séparée) pour que la connexion sur cette page ne
// touche jamais la session de l'onglet principal.

const MIRROR_KEYS = ALL_FIELDS.filter((f) => f.type !== 'computed_days').map((f) => f.key);

const buildKemaskiniPayload = (form, matchedEmployee) => {
  const payload = {};
  MIRROR_KEYS.forEach((key) => { payload[key] = form[key] ?? ''; });
  return {
    ...payload,
    matching_employee_id: matchedEmployee?.id || null,
    is_new_entry: !matchedEmployee,
  };
};

export function useSemakData(client = supabaseSandbox) {
  const [icInput, setIcInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [matchedEmployee, setMatchedEmployee] = useState(null); // record trouvé dans angkatan_employees (ou null)
  const [form, setForm] = useState(null); // formulaire affiché après recherche
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingId, setPendingId] = useState(null); // id du rekod déjà envoyé (pending ou rejected), sinon null
  const [rejectionNote, setRejectionNote] = useState(null); // note admin si le rekod rechargé a été rejeté
  const [lastApprovedAt, setLastApprovedAt] = useState(null); // date d'approbation du dernier rekod traité, si aucun pending/rejected n'existe
  const [icNotFound, setIcNotFound] = useState(false); // true si l'IC n'existe ni dans angkatan_employees ni dans un rekod pending/rejected

  const searchByIc = async () => {
    const cleanIc = formatICNumber(icInput);
    if (!cleanIc || cleanIc.replace(/\D/g, '').length < 12) return;

    setSearching(true);
    const [{ data: empData, error: empError }, { data: pendingData, error: pendingError }, { data: approvedData }] = await Promise.all([
      client.rpc('lookup_employee_by_ic', { p_ic: cleanIc }),
      client
        .from('angkatan_kemaskini')
        .select('*')
        .eq('ic_no', cleanIc)
        .in('review_status', ['pending', 'rejected'])
        .order('submitted_at', { ascending: false })
        .limit(1),
      client
        .from('angkatan_kemaskini')
        .select('id, reviewed_at')
        .eq('ic_no', cleanIc)
        .eq('review_status', 'approved')
        .order('reviewed_at', { ascending: false })
        .limit(1),
    ]);
    setSearching(false);

    if (pendingError) console.error('Erreur chargement rekod pending/rejected:', pendingError.message);

    const found = !empError && empData && empData.length > 0 ? empData[0] : null;
    setMatchedEmployee(found);

    const existingPending = pendingData && pendingData.length > 0 ? pendingData[0] : null;
    if (existingPending) {
      // Rekod déjà envoyé (pending) ou rejeté par admin — on le recharge pour
      // permettre une correction. S'il était rejeté, on garde la note admin
      // pour l'afficher à la personne.
      const { id, matching_employee_id, is_new_entry, review_status, reviewed_by, reviewed_at, admin_notes, submitted_at, created_at, updated_at, ...pendingForm } = existingPending;
      setForm(pendingForm);
      setPendingId(id);
      setRejectionNote(review_status === 'rejected' ? (admin_notes || 'Tiada sebab dinyatakan.') : null);
      setIcNotFound(false);
    } else if (found) {
      setForm({ ...found });
      setPendingId(null);
      setRejectionNote(null);
      setIcNotFound(false);
      const lastApproved = approvedData && approvedData.length > 0 ? approvedData[0] : null;
      setLastApprovedAt(lastApproved?.reviewed_at ? new Date(lastApproved.reviewed_at) : null);
    } else {
      // IC introuvable dans angkatan_employees et aucun rekod pending/rejected —
      // pas de création de nouveau rekod, réservé aux anggota déjà enregistrés.
      setForm(null);
      setPendingId(null);
      setRejectionNote(null);
      setLastApprovedAt(null);
      setIcNotFound(true);
    }
    setSearched(true);
  };

  const resetSearch = () => {
    setSearched(false);
    setMatchedEmployee(null);
    setForm(null);
    setIcInput('');
    setSubmitted(false);
    setPendingId(null);
    setRejectionNote(null);
    setLastApprovedAt(null);
    setIcNotFound(false);
  };

  const submitKemaskini = async () => {
    if (!form?.ic_no) return false;
    setSubmitting(true);
    const payload = {
      ...buildKemaskiniPayload(form, matchedEmployee),
      review_status: 'pending',
      admin_notes: null,
      reviewed_at: null,
      reviewed_by: null,
    };

    let error;
    if (pendingId) {
      ({ error } = await client.from('angkatan_kemaskini').update(payload).eq('id', pendingId));
    } else {
      ({ error } = await client.from('angkatan_kemaskini').insert([payload]));
    }
    setSubmitting(false);
    if (error) {
      Platform.OS === 'web' ? alert('Ralat: ' + error.message) : null;
      return false;
    }
    setSubmitted(true);
    return true;
  };

  return {
    icInput, setIcInput, searching, searched, matchedEmployee, form, setForm,
    searchByIc, resetSearch, submitting, submitted, submitKemaskini,
    pendingId, rejectionNote, lastApprovedAt, icNotFound,
  };
}