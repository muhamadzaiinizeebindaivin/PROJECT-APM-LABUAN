import { useState, useCallback } from 'react';
import { supabaseSandbox } from '../supabaseSandboxClient';

export function useEmployeePromotionHistory() {
  const [promotionHistoryList, setPromotionHistoryList] = useState([]);

  const fetchPromotionHistory = useCallback(async (employeeId) => {
    try {
      const { data, error } = await supabaseSandbox
        .from('angkatan_promotion_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('pasukan_number', { ascending: true });
      if (error) throw error;
      setPromotionHistoryList(data || []);
    } catch (error) {
      console.error('Error fetching promotion history:', error);
    }
  }, []);

  return { promotionHistoryList, fetchPromotionHistory };
}