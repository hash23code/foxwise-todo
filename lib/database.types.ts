export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          period: 'monthly' | 'yearly'
          parent_type: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          period: 'monthly' | 'yearly'
          parent_type?: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          period?: 'monthly' | 'yearly'
          parent_type?: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          category: string
          amount: number
          description: string | null
          date: string
          is_recurring: boolean
          recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date: string | null
          wallet_id: string | null
          budget_id: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          category: string
          amount: number
          description?: string | null
          date: string
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date?: string | null
          wallet_id?: string | null
          budget_id?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense' | 'bills' | 'debt_payment' | 'savings'
          category?: string
          amount?: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date?: string | null
          wallet_id?: string | null
          budget_id?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          amount: number
          current_value: number
          purchase_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          amount: number
          current_value: number
          purchase_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          amount?: number
          current_value?: number
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'main' | 'savings' | 'business' | 'investment' | 'other'
          currency: string
          beginning_balance: number
          current_balance: number
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'main' | 'savings' | 'business' | 'investment' | 'other'
          currency?: string
          beginning_balance?: number
          current_balance?: number
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'main' | 'savings' | 'business' | 'investment' | 'other'
          currency?: string
          beginning_balance?: number
          current_balance?: number
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          default_currency: string
          date_format: string
          default_wallet_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_currency?: string
          date_format?: string
          default_wallet_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_currency?: string
          date_format?: string
          default_wallet_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
