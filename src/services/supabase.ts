import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client (safe fallback if env vars not yet set)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Generates a temporary signed URL for a private medical document in the 'medical-records' bucket.
 * Does not expose public links.
 */
export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!supabase) {
    return '';
  }

  try {
    const { data, error } = await supabase.storage
      .from('medical-records')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.warn('Error fetching signed URL from Supabase:', error.message);
      return '';
    }

    return data?.signedUrl || '';
  } catch (err) {
    console.error('Failed to create signed URL:', err);
    return '';
  }
}
