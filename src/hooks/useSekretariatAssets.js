import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const ASSET_COLORS = ['#1D4E89', '#F4762B', '#123456', '#D62828', '#5C6773', '#E8843F'];

export function useSekretariatAssets() {
  const [assetList, setAssetList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .from('sekretariat_assets')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setAssetList(data || []);
    } catch (error) {
      console.error('Error fetching sekretariat_assets:', error);
      setAssetList([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const saveAssetItem = async (form) => {
    try {
      const payload = {
        nama: form.nama?.trim() || '',
        bilangan: parseInt(form.bilangan, 10) || 0,
        icon_key: form.icon_key || 'Package',
      };
      if (form.id) {
        const { error } = await supabaseSandbox.from('sekretariat_assets').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const color = ASSET_COLORS[assetList.length % ASSET_COLORS.length];
        const { error } = await supabaseSandbox.from('sekretariat_assets').insert([{ ...payload, color, display_order: assetList.length }]);
        if (error) throw error;
      }
      await fetchAssets();
      return true;
    } catch (error) {
      console.error('Error saving sekretariat_assets:', error);
      return false;
    }
  };

  const deleteAssetItem = async (id) => {
    try {
      const { error } = await supabaseSandbox.from('sekretariat_assets').delete().eq('id', id);
      if (error) throw error;
      await fetchAssets();
      return true;
    } catch (error) {
      console.error('Error deleting sekretariat_assets:', error);
      return false;
    }
  };

  const assetsUpdatedAt = assetList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { assetList, loading, fetchAssets, saveAssetItem, deleteAssetItem, assetsUpdatedAt };
}