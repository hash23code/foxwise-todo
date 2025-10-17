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
      todo_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_default: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          list_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date: string | null
          completed_at: string | null
          is_recurring: boolean
          recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date: string | null
          tags: string[] | null
          position: number
          estimated_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          list_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date?: string | null
          tags?: string[] | null
          position?: number
          estimated_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          list_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date?: string | null
          tags?: string[] | null
          position?: number
          estimated_hours?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      task_reminders: {
        Row: {
          id: string
          task_id: string
          user_id: string
          reminder_type: 'email' | 'push' | 'both'
          reminder_time: string
          is_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          reminder_type: 'email' | 'push' | 'both'
          reminder_time: string
          is_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          reminder_type?: 'email' | 'push' | 'both'
          reminder_time?: string
          is_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      calendar_notes: {
        Row: {
          id: string
          user_id: string
          date: string
          note: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          note: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          note?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          default_list_id: string | null
          email_reminders_enabled: boolean
          push_reminders_enabled: boolean
          default_reminder_time: number
          theme: string
          language: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_list_id?: string | null
          email_reminders_enabled?: boolean
          push_reminders_enabled?: boolean
          default_reminder_time?: number
          theme?: string
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_list_id?: string | null
          email_reminders_enabled?: boolean
          push_reminders_enabled?: boolean
          default_reminder_time?: number
          theme?: string
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      day_planner: {
        Row: {
          id: string
          user_id: string
          task_id: string
          date: string
          start_time: string
          duration_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          date: string
          start_time: string
          duration_hours: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          date?: string
          start_time?: string
          duration_hours?: number
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

// Convenience type exports
export type TodoList = Database['public']['Tables']['todo_lists']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskReminder = Database['public']['Tables']['task_reminders']['Row']
export type CalendarNote = Database['public']['Tables']['calendar_notes']['Row']
export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type DayPlanner = Database['public']['Tables']['day_planner']['Row']

export type TodoListInsert = Database['public']['Tables']['todo_lists']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskReminderInsert = Database['public']['Tables']['task_reminders']['Insert']
export type CalendarNoteInsert = Database['public']['Tables']['calendar_notes']['Insert']
export type TaskAttachmentInsert = Database['public']['Tables']['task_attachments']['Insert']
export type TaskCommentInsert = Database['public']['Tables']['task_comments']['Insert']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type DayPlannerInsert = Database['public']['Tables']['day_planner']['Insert']
