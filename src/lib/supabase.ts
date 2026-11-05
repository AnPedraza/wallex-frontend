import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL, serverAccounts } from './accounts';

// Cliente de Supabase para las cuentas. Es null cuando faltan las variables y la app usa la cuenta local.
export const supabase = serverAccounts ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
