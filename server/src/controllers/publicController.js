import { supabase } from '../config/supabase.js';

export const getPublicReceipt = async (req, res, next) => {
  try {
    const { share_token } = req.params;

    const { data, error } = await supabase
      .from('receipts')
      .select(`
        id,
        form_data,
        created_at,
        status,
        templates (
          name,
          schema_json
        )
      `)
      .eq('share_token', share_token)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Receipt not found or private.' });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};
