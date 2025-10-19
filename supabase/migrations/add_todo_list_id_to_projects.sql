-- Add todo_list_id to projects table
-- This links each project to a dedicated todo list

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS todo_list_id UUID REFERENCES todo_lists(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_todo_list_id ON projects(todo_list_id);

-- Done! Now each project can have a dedicated todo list
