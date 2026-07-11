import { supabase } from '../config/supabase.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, sort_by = 'created_at', sort_dir = 'desc', search } = req.query;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query.order(sort_by, { ascending: sort_dir === 'asc' });

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const start = (parsedPage - 1) * parsedLimit;
    const end = start + parsedLimit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    res.set('X-Total-Count', count);
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .insert({ name, phone, address, email, user_id: req.user.id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    const { data, error } = await supabase
      .from('customers')
      .update({ name, phone, address, email })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Customer not found' });
      throw error;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
