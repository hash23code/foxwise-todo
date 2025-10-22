-- Add timezone field to user_memory table
ALTER TABLE user_memory
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Toronto';

-- Add comment
COMMENT ON COLUMN user_memory.timezone IS 'User timezone for accurate date/time calculations (IANA timezone format)';

-- Verification
SELECT 'Timezone column added successfully!' as status;
