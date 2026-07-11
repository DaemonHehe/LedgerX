import { supabase } from '../config/supabase.js';

export const getReceipts = async (req, res, next) => {
  try {
    const { from, to, search, page = 1, limit = 50, sort_by = 'created_at', sort_dir = 'desc' } = req.query;
    
    let query = supabase
      .from('receipts')
      .select(`
        id,
        template_id,
        form_data,
        created_at,
        customer_id,
        status,
        templates (
          name
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id);

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (search) query = query.ilike('form_data->>customer_name', `%${search}%`);

    // Basic sorting approach (does not support deep JSON sorting easily via Supabase JS without raw string notation)
    query = query.order(sort_by, { ascending: sort_dir === 'asc' });

    // Pagination
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

export const getReceiptById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        id,
        template_id,
        form_data,
        created_at,
        customer_id,
        status,
        export_format,
        templates (
          name,
          schema_json
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Receipt not found.' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createReceipt = async (req, res, next) => {
  try {
    const { template_id, form_data, parent_receipt_id, customer_id, export_format } = req.body;

    const normalizedFormData = {};
    if (form_data) {
      for (const [key, value] of Object.entries(form_data)) {
        const snakeKey = key
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .trim()
          .replace(/^_/, '');
        
        normalizedFormData[snakeKey] = typeof value === 'string' ? value.trim() : value;
      }
      
      if (normalizedFormData.total_amount) {
        const cleanAmount = String(normalizedFormData.total_amount).replace(/[^\d.-]/g, '');
        normalizedFormData.total_amount = cleanAmount ? String(parseFloat(cleanAmount)) : '0';
      }
    }

    const record = {
      template_id: template_id || null,
      parent_receipt_id: parent_receipt_id || null,
      customer_id: customer_id || null,
      export_format: export_format || 'png',
      form_data: normalizedFormData,
      user_id: req.user.id,
    };

    const { data, error } = await supabase
      .from('receipts')
      .insert(record)
      .select(`
        *,
        templates (
          name
        )
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateReceipt = async (req, res, next) => {
  try {
    const { form_data, customer_id } = req.body;

    const updatePayload = { form_data };
    if (customer_id !== undefined) {
      updatePayload.customer_id = customer_id || null;
    }

    const { data, error } = await supabase
      .from('receipts')
      .update(updatePayload)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select(`
        id,
        template_id,
        form_data,
        created_at,
        customer_id,
        status,
        export_format,
        templates (
          name,
          schema_json
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Receipt not found.' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteReceipt = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getReceiptStats = async (req, res, next) => {
  try {
    const { data, error } = await supabase.rpc('get_receipt_stats', { user_uuid: req.user.id });
    if (error) throw error;
    res.json(data && data.length > 0 ? data[0] : { total_revenue: 0, receipt_count: 0, avg_order_value: 0, top_template_name: null });
  } catch (err) {
    next(err);
  }
};

export const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const tz = req.query.tz || 'UTC';
    const { data, error } = await supabase.rpc('get_weekly_sales', { user_uuid: req.user.id, tz });
    if (error) throw error;
    
    const now = new Date();
    const weeksMap = new Map();
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(now.getDate() - (i * 7));
        const day = d.getDay() || 7; 
        d.setDate(d.getDate() - day + 1);
        d.setHours(0,0,0,0);
        const key = d.toISOString().split('T')[0];
        weeksMap.set(key, { week_start: key, revenue: 0, count: 0 });
    }
    
    if (data) {
        data.forEach(row => {
           const d = new Date(row.week_start);
           const key = d.toISOString().split('T')[0];
           if (weeksMap.has(key)) {
               weeksMap.set(key, { week_start: key, revenue: parseFloat(row.revenue) || 0, count: parseInt(row.count) || 0 });
           }
        });
    }
    
    const filledData = Array.from(weeksMap.values()).sort((a,b) => a.week_start.localeCompare(b.week_start));
    res.json(filledData);
  } catch (err) {
    next(err);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const tz = req.query.tz || 'UTC';
    const { data, error } = await supabase.rpc('get_monthly_sales', { user_uuid: req.user.id, tz });
    if (error) throw error;
    
    const now = new Date();
    const monthsMap = new Map();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        monthsMap.set(key, { month: key, revenue: 0, count: 0 });
    }
    
    if (data) {
        data.forEach(row => {
           const d = new Date(row.month_start);
           const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
           if (monthsMap.has(key)) {
               monthsMap.set(key, { month: key, revenue: parseFloat(row.revenue) || 0, count: parseInt(row.count) || 0 });
           }
        });
    }
    
    const filledData = Array.from(monthsMap.values()).sort((a,b) => a.month.localeCompare(b.month));
    res.json(filledData);
  } catch (err) {
    next(err);
  }
};

export const getTemplatePerformance = async (req, res, next) => {
  try {
    const { data, error } = await supabase.rpc('get_template_performance', { user_uuid: req.user.id });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

export const getDailyAnalytics = async (req, res, next) => {
  try {
    const tz = req.query.tz || 'UTC';
    const { data, error } = await supabase.rpc('get_daily_sales', { user_uuid: req.user.id, tz });
    if (error) throw error;
    
    const now = new Date();
    const daysMap = new Map();
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0,0,0,0);
        const key = d.toISOString().split('T')[0];
        daysMap.set(key, { day_start: key, revenue: 0, count: 0 });
    }
    
    if (data) {
        data.forEach(row => {
           const d = new Date(row.day_start);
           const key = d.toISOString().split('T')[0];
           if (daysMap.has(key)) {
               daysMap.set(key, { day_start: key, revenue: parseFloat(row.revenue) || 0, count: parseInt(row.count) || 0 });
           }
        });
    }
    
    const filledData = Array.from(daysMap.values()).sort((a,b) => a.day_start.localeCompare(b.day_start));
    res.json(filledData);
  } catch (err) {
    next(err);
  }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const { data, error } = await supabase.rpc('get_top_customers', { user_uuid: req.user.id });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

export const generateShareToken = async (req, res, next) => {
  try {
    // 1. Fetch current receipt to see if it already has a share_token
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('share_token')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Receipt not found.' });
      }
      throw fetchError;
    }

    if (receipt.share_token) {
      return res.json({ share_token: receipt.share_token });
    }

    // 2. Generate a new token by updating the receipt and returning the new token (Supabase handles UUID default if we don't supply it, but since it's an update we must generate it or rely on Postgres. Since we can't easily trigger the default on update, we'll just set it to gen_random_uuid() via RPC or crypto, or we can just fetch a random UUID).
    // Actually, setting share_token to gen_random_uuid() in supabase JS is hard. Let's just generate a UUID in Node.
    const crypto = await import('crypto');
    const newToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from('receipts')
      .update({ share_token: newToken, status: 'sent' }) // Priority 4 logic: change to sent when shared
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('share_token')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateReceiptStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'sent', 'paid', 'void'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('receipts')
      .update({ status })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Receipt not found.' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};
