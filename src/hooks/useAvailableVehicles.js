// src/hooks/useAvailableVehicles.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';

/**
 * Fetches land ("Darat") vehicles that are in good condition ("Baik") for
 * the driver's vehicle-selection screen. Logic/messages unchanged from
 * the original DriverScreen.js mount effect.
 */
export function useAvailableVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('logistik')
          .select('id, model, reg, type, color')
          .eq('category', 'Darat')
          .eq('status', 'Baik')
          .order('model', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          if (isMounted) setVehicles(data);
        } else {
          throw new Error("Tiada kenderaan darat yang berstatus 'Baik' dijumpai.");
        }
      } catch (error) {
        console.error("Gagal mengambil data kenderaan:", error.message);
        if (isMounted) {
          Alert.alert(
            'Ralat Pangkalan Data',
            'Gagal memuat turun senarai kenderaan. Sila hubungi admin atau semak sambungan internet.'
          );
          setVehicles([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVehicles();
    return () => { isMounted = false; };
  }, []);

  return { vehicles, loading };
}
