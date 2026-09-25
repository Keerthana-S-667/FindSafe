import { useState, useEffect } from 'react';
import { HealthResponse } from '../types';
import { checkBackendHealth } from '../services/api';

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchHealth() {
      try {
        const data = await checkBackendHealth();
        if (active) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Backend offline');
          setHealth(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchHealth();
    return () => {
      active = false;
    };
  }, []);

  return { health, loading, error };
}
