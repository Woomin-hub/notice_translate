import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5'
import { SUPABASE_CONFIG } from './config.js'

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
