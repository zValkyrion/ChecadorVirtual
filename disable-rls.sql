-- Alternative solution: Disable RLS on usuarios table
-- WARNING: This removes all row-level security protections
-- Only use this if you're handling all security at the application level

ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
