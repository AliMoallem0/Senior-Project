import { supabaseAdmin } from './supabase';

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const setupAdminDatabase = async () => {
  try {
    // Create admin_logs table
    const { error: logsError } = await supabaseAdmin.rpc('create_admin_logs_table');
    if (logsError) throw logsError;

    // Create admin_settings table
    const { error: settingsError } = await supabaseAdmin.rpc('create_admin_settings_table');
    if (settingsError) throw settingsError;

    // Add admin columns to users table
    const { error: usersError } = await supabaseAdmin.rpc('add_admin_columns_to_users');
    if (usersError) throw usersError;

    // Create default admin settings
    const defaultSettings = [
      {
        key: 'user_suspension_duration',
        value: { days: 30 },
        description: 'Default duration for user suspensions'
      },
      {
        key: 'max_login_attempts',
        value: { count: 5 },
        description: 'Maximum number of failed login attempts before account lock'
      },
      {
        key: 'session_timeout',
        value: { minutes: 30 },
        description: 'Session timeout duration in minutes'
      }
    ];

    for (const setting of defaultSettings) {
      const { error: insertError } = await supabaseAdmin
        .from('admin_settings')
        .upsert(setting, { onConflict: 'key' });
      
      if (insertError) throw insertError;
    }

    console.log('Admin database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up admin database:', error);
    return false;
  }
};

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
) => {
  try {
    const { error } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging admin action:', error);
    return false;
  }
};

export const getAdminSettings = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return null;
  }
};

export const updateAdminSetting = async (
  key: string,
  value: any,
  description?: string,
  updatedBy: string
) => {
  try {
    const { error } = await supabaseAdmin
      .from('admin_settings')
      .upsert({
        key,
        value,
        description,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating admin setting:', error);
    return false;
  }
}; 