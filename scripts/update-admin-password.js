import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateAdminPassword(username, newHashedPassword) {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Update the user's password
    const { data, error } = await supabase
      .from('usuarios')
      .update({ 
        contraseña: newHashedPassword 
      })
      .eq('usuario', username)
      .eq('rol', 'admin')
      .eq('activo', true)
      .select();

    if (error) {
      console.error('Error updating password:', error);
      process.exit(1);
    }

    if (data.length === 0) {
      console.error('No admin user found with the specified username.');
      process.exit(1);
    }

    console.log('Admin password updated successfully for user:', username);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Usage: node update-admin-password.js <username> <hashedPassword>
const username = process.argv[2];
const hashedPassword = process.argv[3];

if (!username || !hashedPassword) {
  console.error('Usage: node update-admin-password.js <username> <hashedPassword>');
  process.exit(1);
}

updateAdminPassword(username, hashedPassword);
