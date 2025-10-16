-- Add estimated_hours column to tasks table
-- This migration adds time estimation functionality to tasks

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2);

COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated time to complete task in hours (e.g., 2.5 for 2.5 hours)';
