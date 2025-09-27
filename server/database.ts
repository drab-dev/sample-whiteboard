import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class Database {
  // User operations
  static async createUser(email: string, name: string, passwordHash: string, organizationId: string) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Organization operations
  static async createOrganization(name: string) {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrganization(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Whiteboard operations
  static async createWhiteboard(title: string, ownerId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('whiteboards')
      .insert({
        title,
        owner_id: ownerId,
        organization_id: organizationId,
        content: { objects: [], version: 0 }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWhiteboardsForUser(userId: string) {
    // Get whiteboards user owns or has permission to
    const { data, error } = await supabase
      .from('whiteboards')
      .select(`
        *,
        whiteboard_permissions!inner (
          permission,
          user_id
        )
      `)
      .or(`owner_id.eq.${userId},whiteboard_permissions.user_id.eq.${userId}`);

    if (error) throw error;
    return data;
  }

  static async getWhiteboard(id: string) {
    const { data, error } = await supabase
      .from('whiteboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWhiteboardContent(id: string, content: any) {
    const { data, error } = await supabase
      .from('whiteboards')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWhiteboardTitle(id: string, title: string) {
    const { data, error } = await supabase
      .from('whiteboards')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWhiteboard(id: string) {
    const { error } = await supabase
      .from('whiteboards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Permission operations
  static async addWhiteboardPermission(whiteboardId: string, userId: string, permission: string) {
    const { data, error } = await supabase
      .from('whiteboard_permissions')
      .insert({
        whiteboard_id: whiteboardId,
        user_id: userId,
        permission
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserPermission(whiteboardId: string, userId: string) {
    const { data, error } = await supabase
      .from('whiteboard_permissions')
      .select('permission')
      .eq('whiteboard_id', whiteboardId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.permission;
  }

  static async getWhiteboardCollaborators(whiteboardId: string) {
    const { data, error } = await supabase
      .from('whiteboard_permissions')
      .select(`
        permission,
        users (
          id,
          name,
          email
        )
      `)
      .eq('whiteboard_id', whiteboardId);

    if (error) throw error;
    return data;
  }
}