-- Remove the restrictive date constraint that prevents creating notes for past dates
-- This constraint causes issues with timezone differences between client and server

ALTER TABLE calendar_notes DROP CONSTRAINT IF EXISTS valid_date;

-- Optionally, you can add a more reasonable constraint that allows dates within a reasonable range
-- For example, allow dates from 1 year in the past to 10 years in the future
-- Uncomment the following lines if you want this constraint:

-- ALTER TABLE calendar_notes ADD CONSTRAINT valid_date_range
--   CHECK (date >= CURRENT_DATE - INTERVAL '1 year' AND date <= CURRENT_DATE + INTERVAL '10 years');
