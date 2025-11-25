-- Ensure upsert operations work smoothly on user_posts table
-- Update RLS policies to be more explicit about upsert operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own post count" ON public.user_posts;
DROP POLICY IF EXISTS "Users can update own post count" ON public.user_posts;
DROP POLICY IF EXISTS "Users can view own post count" ON public.user_posts;

-- Recreate policies with better naming and ensure they work for upsert
CREATE POLICY "Users can view their own post count"
  ON public.user_posts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post count"
  ON public.user_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post count"
  ON public.user_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);