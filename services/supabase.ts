
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whdeqsovmdbwbirzmzuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZGVxc292bWRid2JpcnptenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODE3NTUsImV4cCI6MjA4MjU1Nzc1NX0.Y6gOVxxwWjVMin1MfBWrL_DhVGVBg0VXy5uLVcE5P3o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
