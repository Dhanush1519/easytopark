// Quick script to create admin account via Supabase signup API
const SUPABASE_URL = 'https://zgnsbhoohpwfxwryyhpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5xmTpF1FdFssRRIeFNyVqA_GYQsROET';

async function createAdmin() {
  console.log('Creating admin account...');
  
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify({
      email: 'admin@easypark.com',
      password: 'admin123',
      data: {
        full_name: 'Platform Admin',
        role: 'admin'
      }
    })
  });

  const data = await res.json();
  
  if (data.error) {
    console.error('Signup error:', data.error);
    return;
  }

  console.log('Admin created! User ID:', data.user?.id || data.id);
  console.log('Email:', data.user?.email || data.email);
  
  // Now verify the profile was created with admin role
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user?.id || data.id}&select=id,full_name,role`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const profile = await profileRes.json();
  console.log('Profile:', profile);
  console.log('\n✅ Admin login credentials:');
  console.log('   Email: admin@easypark.com');
  console.log('   Password: admin123');
}

createAdmin().catch(console.error);
