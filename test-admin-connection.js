/**
 * Test script to verify Supabase admin client connection
 * Run with: node test-admin-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase admin connection...\n');

// Check env vars
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

console.log('✓ Environment variables found');
console.log('  URL:', supabaseUrl);
console.log('  Service key starts with:', serviceRoleKey.substring(0, 30) + '...');
console.log('  Service key length:', serviceRoleKey.length, 'chars\n');

// Create admin client
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test query
async function testConnection() {
  try {
    console.log('Testing SELECT query...');
    const { data, error } = await adminClient
      .from('question_sets')
      .select('id, code, name')
      .limit(5);

    if (error) {
      console.error('❌ SELECT query failed:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✓ SELECT query successful');
    console.log('  Found', data?.length || 0, 'question sets\n');

    // Test DELETE capability (without actually deleting)
    console.log('Testing DELETE permissions...');
    const { error: deleteError } = await adminClient
      .from('question_sets')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake UUID

    // This should succeed (no error) even if no rows match
    // A 403 error would indicate permission issues
    if (deleteError && deleteError.code === '42501') {
      console.error('❌ DELETE permission denied (403)');
      console.error('   This means your service role key is incorrect or lacks permissions');
      process.exit(1);
    }

    console.log('✓ DELETE permissions verified');
    console.log('\n✅ All tests passed! Your admin client is working correctly.\n');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
