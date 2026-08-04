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
    try {
      const payload = {
        employee_id: employeeId,
        nom_certificat: certForm.nom_certificat,
        google_drive_link: certForm.google_drive_link,
        kategori: certForm.kategori || 'Lain-lain',
      };
      const { error } = certForm.id
        ? await supabaseSandbox.from('angkatan_certificates').update(payload).eq('id', certForm.id)
        : await supabaseSandbox.from('angkatan_certificates').insert([payload]);
      if (error) throw error;
      await fetchCertificates(employeeId);
      return true;
    } catch (error) {
      console.error('Error saving certificate:', error);
      return false;
    }
  };

  const deleteCertificate = async (id, employeeId) => {
    try {
      const { error } = await supabaseSandbox.from('angkatan_certificates').delete().eq('id', id);
      if (error) throw error;
      await fetchCertificates(employeeId);
      return true;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      return false;
    }
  };

  const openCertificateLink = (link) => {
    Linking.openURL(link).catch(() => Alert.alert('Ralat', 'Tidak dapat membuka pautan.'));
  };

  return { certificates, fetchCertificates, saveCertificate, deleteCertificate, openCertificateLink };
}