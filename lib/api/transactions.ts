import { supabase } from '../supabase';
import { Database } from '../database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

export async function getTransactionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

export async function createTransaction(transaction: TransactionInsert) {
  const { data, error } = await supabase
    .from('transactions')
    // @ts-ignore
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(id: string, updates: TransactionUpdate) {
  const { data, error } = await supabase
    .from('transactions')
    // @ts-ignore
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
