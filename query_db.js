const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryQuestionSets() {
  const { data, error } = await supabase
    .from('question_sets')
    .select('code, name, difficulty, mode, subject, grade, question_count, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log(JSON.stringify(data, null, 2));
}

queryQuestionSets();
