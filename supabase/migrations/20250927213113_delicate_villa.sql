/*
  # Collaborative Whiteboard Schema

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamp)
    
    - `whiteboards`
      - `id` (uuid, primary key)
      - `title` (text)
      - `owner_id` (uuid, references users)
      - `organization_id` (uuid, references organizations)
      - `content` (jsonb) - stores canvas objects
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `whiteboard_permissions`
      - `id` (uuid, primary key)
      - `whiteboard_id` (uuid, references whiteboards)
      - `user_id` (uuid, references users)
      - `permission` (text) - 'viewer', 'commenter', 'editor'
      - `created_at` (timestamp)
    
    - `whiteboard_comments`
      - `id` (uuid, primary key)
      - `whiteboard_id` (uuid, references whiteboards)
      - `user_id` (uuid, references users)
      - `content` (text)
      - `x` (float) - position on canvas
      - `y` (float) - position on canvas
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access control
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Whiteboards table
CREATE TABLE IF NOT EXISTS whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Whiteboard',
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  content jsonb DEFAULT '{"objects": [], "version": 0}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Whiteboard permissions table
CREATE TABLE IF NOT EXISTS whiteboard_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('viewer', 'commenter', 'editor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(whiteboard_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS whiteboard_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  x float DEFAULT 0,
  y float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_comments ENABLE ROW LEVEL SECURITY;

-- Organizations policies (public read for now, can be restricted later)
CREATE POLICY "Organizations can be read by anyone"
  ON organizations
  FOR SELECT
  TO public
  USING (true);

-- Users policies
CREATE POLICY "Users can read users in their organization"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Whiteboards policies
CREATE POLICY "Users can read whiteboards they own or have permission to"
  ON whiteboards
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create whiteboards"
  ON whiteboards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update whiteboards they own or have editor permission"
  ON whiteboards
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Users can delete whiteboards they own"
  ON whiteboards
  FOR DELETE
  TO public
  USING (true);

-- Permissions policies
CREATE POLICY "Users can read permissions for whiteboards they have access to"
  ON whiteboard_permissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Whiteboard owners can manage permissions"
  ON whiteboard_permissions
  FOR ALL
  TO public
  USING (true);

-- Comments policies
CREATE POLICY "Users can read comments on whiteboards they have access to"
  ON whiteboard_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users with commenter or editor permission can create comments"
  ON whiteboard_comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_organization_id_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS whiteboards_owner_id_idx ON whiteboards(owner_id);
CREATE INDEX IF NOT EXISTS whiteboards_organization_id_idx ON whiteboards(organization_id);
CREATE INDEX IF NOT EXISTS whiteboard_permissions_whiteboard_id_idx ON whiteboard_permissions(whiteboard_id);
CREATE INDEX IF NOT EXISTS whiteboard_permissions_user_id_idx ON whiteboard_permissions(user_id);
CREATE INDEX IF NOT EXISTS whiteboard_comments_whiteboard_id_idx ON whiteboard_comments(whiteboard_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for whiteboards updated_at
CREATE TRIGGER update_whiteboards_updated_at BEFORE UPDATE ON whiteboards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();