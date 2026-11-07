import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import type { Database } from '../../lib/database.types';
import type { AddressValues, PersonalDetailsValues } from './schemas';

export type Address = Database['public']['Tables']['addresses']['Row'];

export function useAccount() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.id;
  const addressesKey = ['account', 'addresses', uid];

  const addresses = useQuery({
    queryKey: addressesKey,
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
  });

  const invalidateAddresses = () => queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });

  const saveProfile = useMutation({
    mutationFn: async (values: PersonalDetailsValues) => {
      if (!uid) throw new Error('Please sign in again.');
      const patch: Database['public']['Tables']['profiles']['Update'] = {
        full_name: values.full_name,
        phone: values.phone,
        whatsapp_opt_in: values.whatsapp_opt_in,
      };
      // Birthday is set once; only send it when it isn't locked yet.
      if (!profile?.dob_locked && values.date_of_birth) patch.date_of_birth = values.date_of_birth;
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
      if (error) throw error;
      await refreshProfile();
    },
  });

  const saveAddress = useMutation({
    mutationFn: async ({ id, values, makeDefault }: { id?: string; values: AddressValues; makeDefault?: boolean }) => {
      const row = { ...values, ...(makeDefault ? { is_default: true } : {}) };
      const { error } = id
        ? await supabase.from('addresses').update(row).eq('id', id)
        : await supabase.from('addresses').insert(row);
      if (error) throw error;
    },
    onSuccess: invalidateAddresses,
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAddresses,
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAddresses,
  });

  return { user, profile, addresses, saveProfile, saveAddress, deleteAddress, setDefault };
}
