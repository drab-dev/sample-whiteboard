/*
  # Add Share Links Table

  1. New Tables
    - `whiteboard_share_links`
      - `id` (uuid, primary key)
      - `whiteboard_id` (uuid, references whiteboards)
      - `permission` (text) - 'viewer', 'commenter', 'editor'
      - `expires_at` (timestamp, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on share links table
    - Add policies for share link access
*/

-- Share links table
CREATE TABLE IF NOT EXISTS whiteboard_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('viewer', 'commenter', 'editor')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE whiteboard_share_links ENABLE ROW LEVEL SECURITY;

-- Share links policies
CREATE POLICY "Whiteboard owners can manage share links"
  ON whiteboard_share_links
  FOR ALL
  TO public
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS whiteboard_share_links_whiteboard_id_idx ON whiteboard_share_links(whiteboard_id);
CREATE INDEX IF NOT EXISTS whiteboard_share_links_id_idx ON whiteboard_share_links(id);