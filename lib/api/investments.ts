import { supabase } from "../supabase";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  symbol?: string; // Ticker symbol (e.g., BTC, AAPL)
  quantity?: number; // Number of units/shares
  purchase_price_per_unit?: number; // Price per unit at purchase
  created_at?: string;
  updated_at?: string;
}

export interface InvestmentInsert {
  user_id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  symbol?: string;
  quantity?: number;
  purchase_price_per_unit?: number;
}

export async function getInvestments(userId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false });

  if (error) throw error;
  return data as Investment[];
}

export async function createInvestment(investment: InvestmentInsert): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    // @ts-ignore
    .insert(investment)
    .select()
    .single();

  if (error) throw error;
  return data as Investment;
}

export async function updateInvestment(id: string, updates: Partial<InvestmentInsert>): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    // @ts-ignore
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Investment;
}

export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
