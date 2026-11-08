import { useMemo } from 'react';
import { useBootstrap } from '../../lib/bootstrap';
import { COMPLIANCE_FIELDS } from './productForm';

type ComplianceKey = (typeof COMPLIANCE_FIELDS)[number][0];

/** Settings → Product details: the label details shared by every product (empty strings are left out). */
export function useProductDefaults(): Partial<Record<ComplianceKey, string>> {
  const { data } = useBootstrap();
  const settings = (data?.settings ?? {}) as Record<string, unknown>;
  const key = COMPLIANCE_FIELDS.map(([k]) => String(settings[`product_defaults.${k}`] ?? '')).join('|');
  return useMemo(() => {
    const out: Partial<Record<ComplianceKey, string>> = {};
    for (const [k] of COMPLIANCE_FIELDS) {
      const v = settings[`product_defaults.${k}`];
      if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = String(v);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
