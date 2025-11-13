// Temporary script to activate all users
// Run this once then delete the file

import { supabase } from '../lib/supabase';

async function activateAllUsers() {
  console.log('🔄 Activating all users...');
  
  try {
    // Get all users first
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, email, is_active');
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${users?.length} users`);
    
    // Update all users to active
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .neq('is_active', null) // Update all (condition that's always true for non-null)
      .select();
    
    if (error) {
      console.error('❌ Error updating users:', error);
      return;
    }
    
    console.log(`✅ Successfully activated all users!`);
    console.log(`📝 Updated ${data?.length} users`);
    
    // Show results
    const { data: updatedUsers } = await supabase
      .from('users')
      .select('full_name, email, is_active')
      .order('full_name');
    
    console.log('\n📋 All users status:');
    updatedUsers?.forEach(user => {
      console.log(`  ${user.is_active ? '✅' : '❌'} ${user.full_name} (${user.email})`);
    });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the function
activateAllUsers();

