import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zgnsbhoohpwfxwryyhpx.supabase.co', 'sb_publishable_5xmTpF1FdFssRRIeFNyVqA_GYQsROET');

async function test() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking_spots!inner(name, owner_id), user:profiles!bookings_user_id_fkey(full_name)')
    .eq('parking_spots.owner_id', '54317585-d856-4746-8d78-548038c80bdb');

  if (error) {
    console.error('QUERY ERROR:', error);
  } else {
    console.log('QUERY SUCCESS:', data);
  }
}
test();
