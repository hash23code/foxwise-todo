-- ============================================
-- PROJECTS FEATURE - Complete Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  start_date DATE,
  target_end_date DATE,
  color TEXT NOT NULL DEFAULT '#667eea',
  ai_plan JSONB, -- Stores the AI-generated plan structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create project_steps table (tasks within a project - SEPARATE from tasks table)
CREATE TABLE IF NOT EXISTS project_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  estimated_hours NUMERIC(5,2),
  todo_list_id UUID, -- Link to todo_lists if user wants to connect
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_steps_project_id ON project_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_project_steps_status ON project_steps(status);

-- 4. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- 6. Create RLS policies for project_steps
CREATE POLICY "Users can view project_steps of own projects"
  ON project_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_steps.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert project_steps to own projects"
  ON project_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_steps.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update project_steps of own projects"
  ON project_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_steps.project_id
      AND projects.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_steps.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete project_steps of own projects"
  ON project_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_steps.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

-- 7. Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_steps_updated_at
  BEFORE UPDATE ON project_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Done! Projects feature is ready
