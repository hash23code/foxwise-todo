import { supabase } from '../supabase';
import { Database } from '../database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export async function getBudgets(userId: string) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('category', { ascending: true });

  if (error) throw error;
  return data as Budget[];
}

export async function createBudget(budget: BudgetInsert) {
  const { data, error } = await supabase
    .from('budgets')
    .insert(budget)
    .select()
    .single();

  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(id: string, updates: BudgetUpdate) {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Budget;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
