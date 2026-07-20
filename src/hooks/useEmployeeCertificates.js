import { useState, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useEmployeeCertificates() {
  const [certificates, setCertificates] = useState([]);

  const fetchCertificates = useCallback(async (employeeId) => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_certificates')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  }, []);

  const saveCertificate = async (employeeId, certForm) => {
    const payload = { employee_id: employeeId, nom_certificat: certForm.nom_certificat, google_drive_link: certForm.google_drive_link };
    if (certForm.id) await supabaseSandbox.from('angkatan_certificates').update(payload).eq('id', certForm.id);
    else await supabaseSandbox.from('angkatan_certificates').insert([payload]);
    await fetchCertificates(employeeId);
  };

  const deleteCertificate = async (id, employeeId) => {
    await supabaseSandbox.from('angkatan_certificates').delete().eq('id', id);
    await fetchCertificates(employeeId);
  };

  const openCertificateLink = (link) => {
    Linking.openURL(link).catch(() => Alert.alert('Ralat', 'Tidak dapat membuka pautan.'));
  };

  return { certificates, fetchCertificates, saveCertificate, deleteCertificate, openCertificateLink };
}