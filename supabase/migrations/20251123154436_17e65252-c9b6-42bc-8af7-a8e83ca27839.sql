-- Create user_posts table to track post counts
CREATE TABLE public.user_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own post count
CREATE POLICY "Users can view own post count"
ON public.user_posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own post count
CREATE POLICY "Users can insert own post count"
ON public.user_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own post count
CREATE POLICY "Users can update own post count"
ON public.user_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to auto-insert user_posts record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_posts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_posts (user_id, post_count)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

-- Trigger to create user_posts record on user signup
CREATE TRIGGER on_auth_user_created_posts
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_posts();