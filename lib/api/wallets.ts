import { supabase } from '../supabase';
import { Database } from '../database.types';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type WalletInsert = Database['public']['Tables']['wallets']['Insert'];
type WalletUpdate = Database['public']['Tables']['wallets']['Update'];

export async function getWallets(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Wallet[];
}

export async function createWallet(wallet: WalletInsert) {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      ...wallet,
      current_balance: wallet.beginning_balance || 0
    })
    .select()
    .single();

  if (error) throw error;
  return data as Wallet;
}

export async function updateWallet(id: string, updates: WalletUpdate) {
  const { data, error } = await supabase
    .from('wallets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Wallet;
}

export async function deleteWallet(id: string) {
  const { error } = await supabase
    .from('wallets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function getWalletBalance(walletId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('current_balance')
    .eq('id', walletId)
    .single();

  if (error) throw error;
  return data.current_balance;
}
