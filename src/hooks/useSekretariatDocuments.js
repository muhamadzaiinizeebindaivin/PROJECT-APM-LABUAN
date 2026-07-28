import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const BUCKET = 'sekretariat-documents';

export function useSekretariatDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .from('sekretariat_documents')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching sekretariat_documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // file: objet File (web) choisi via <input type="file">
  // Titre auto-dérivé du nom de fichier : "Laporan_Tahunan_2026.pdf" -> "Laporan Tahunan 2026"
  const deriveTajukFromFileName = (fileName) => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    return withoutExt.replace(/[_-]+/g, ' ').trim();
  };

  const uploadDocument = async (file, editItem) => {
    try {
      setUploading(true);
      const ext = file.name.split('.').pop().toLowerCase();
      const fileType = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? 'image' : 'pdf';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseSandbox.storage
        .from(BUCKET)
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabaseSandbox.storage.from(BUCKET).getPublicUrl(fileName);

      const payload = {
        tajuk: deriveTajukFromFileName(file.name),
        deskripsi: '',
        file_url: urlData.publicUrl,
        file_type: fileType,
      };

      const { error } = editItem?.id
        ? await supabaseSandbox.from('sekretariat_documents').update(payload).eq('id', editItem.id)
        : await supabaseSandbox.from('sekretariat_documents').insert([{ ...payload, display_order: documents.length }]);
      if (error) throw error;

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error saving sekretariat_documents:', error);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (item) => {
    try {
      if (item.file_url) {
        const fileName = item.file_url.split('/').pop();
        await supabaseSandbox.storage.from(BUCKET).remove([fileName]);
      }
      const { error } = await supabaseSandbox.from('sekretariat_documents').delete().eq('id', item.id);
      if (error) throw error;
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error deleting sekretariat_documents:', error);
      return false;
    }
  };

  return { documents, loading, uploading, fetchDocuments, uploadDocument, deleteDocument };
}