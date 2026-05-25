import { createClient }
from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl =
"https://mvxkgarnskqmiljigddr.supabase.co";

const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eGtnYXJuc2txbWlsamlnZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDMyODQsImV4cCI6MjA5NTE3OTI4NH0.7vf-a_rmc2QMqHv3IJ3pTxRb7bVay-MHHQ0btzAhyKs";

export const supabase =
createClient(
  supabaseUrl,
  supabaseKey
);