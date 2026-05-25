import { createClient }
from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl =
"https://mvxkgarnskqmiljigddr.supabase.co";

const supabaseKey =
"sb_publishable_560MMRNLpjkgu_zOgxwMng_7Xy1NQvW";

export const supabase =
createClient(
  supabaseUrl,
  supabaseKey
);