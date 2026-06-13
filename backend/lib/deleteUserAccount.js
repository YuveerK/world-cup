const supabase = require('./supabase');

async function deleteUserAccount(userId) {
  const id = String(userId);

  const { error: pointsError } = await supabase
    .from('points')
    .delete()
    .eq('user_id', id);
  if (pointsError) throw pointsError;

  const { error: predictionsError } = await supabase
    .from('predictions')
    .delete()
    .eq('user_id', id);
  if (predictionsError) throw predictionsError;

  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (userError) throw userError;
}

module.exports = deleteUserAccount;
