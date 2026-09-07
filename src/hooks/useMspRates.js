import { useState, useEffect } from "react";
import api from "../api/index";

// Fallback defaults — used until the API responds
const DEFAULTS = { azure: 0.07, aws: 0.035, gcp: 0.02, btp: 0.02 };

let _cache = null; // module-level cache so all components share one fetch per session

/**
 * Returns live MSP rates from the backend.
 * { rates: { azure, aws, gcp, btp }, loading }
 * Falls back to DEFAULTS if the API fails.
 */
export function useMspRates() {
  const [rates, setRates] = useState(_cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return;
    api
      .get("/insights/msp-savings")
      .then((res) => {
        const breakdown = res.data?.breakdown ?? [];
        if (breakdown.length > 0) {
          const r = { ...DEFAULTS };
          for (const b of breakdown) {
            if (b.provider && b.savingsRate != null) r[b.provider] = b.savingsRate;
          }
          _cache = r;
          setRates(r);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading };
}
