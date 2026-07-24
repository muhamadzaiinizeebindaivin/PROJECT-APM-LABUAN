import { useState, useEffect, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

const SCHEMA = 'sandbox';

export function useUnitStaff(page, onChange) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseSandbox
        .schema(SCHEMA)
        .from('unit_staff')
        .select('*')
        .eq('page', page)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error(`Error fetching unit_staff (${page}):`, error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const saveStaffItem = async (draft, editItem) => {
    const payload = {
      page,
      name: draft.name,
      role: draft.role,
      display_order: editItem ? editItem.display_order : staffList.length,
    };
    try {
      if (editItem?.id) {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').insert([payload]);
        if (error) throw error;
      }
      await fetchStaff();
      onChange?.();
      return true;
    } catch (error) {
      console.error('Error saving unit_staff:', error);
      return false;
    }
  };

  const deleteStaffItem = async (item) => {
    if (!item || item.id === undefined) return false;
    try {
      const { error } = await supabaseSandbox.schema(SCHEMA).from('unit_staff').delete().eq('id', item.id);
      if (error) throw error;
      await fetchStaff();
      onChange?.();
      return true;
    } catch (error) {
      console.error('Error deleting unit_staff:', error);
      return false;
    }
  };

  const reorderStaff = async (reorderedList) => {
    setStaffList(reorderedList);
    try {
      for (let i = 0; i < reorderedList.length; i++) {
        const item = reorderedList[i];
        if (item.display_order !== i) {
          await supabaseSandbox.schema(SCHEMA).from('unit_staff').update({ display_order: i }).eq('id', item.id);
        }
      }
      await fetchStaff();
      onChange?.();
      return true;
    } catch (error) {
      console.error('Error reordering unit_staff:', error);
      await fetchStaff();
      return false;
    }
  };

  const staffUpdatedAt = staffList.reduce(
    (latest, item) => (item.updated_at && (!latest || item.updated_at > latest) ? item.updated_at : latest),
    null
  );

  return { staffList, loading, saveStaffItem, deleteStaffItem, reorderStaff, staffUpdatedAt };
}