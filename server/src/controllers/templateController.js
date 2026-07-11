import { supabase } from '../config/supabase.js';
import { welcomeTemplateSchema } from '../../data/welcomeTemplate.js';

export const getTemplates = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, schema_json, created_at, updated_at, is_example')
      .or(`user_id.eq.${req.user.id},is_example.eq.true`)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', req.params.id)
      .or(`user_id.eq.${req.user.id},is_example.eq.true`)
      .eq('is_archived', false)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: error?.message || 'Template not found.' });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, schema_json } = req.body;

    const record = {
      name: name || 'Untitled Template',
      schema_json,
      user_id: req.user.id,
    };

    const { data, error } = await supabase
      .from('templates')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { name, schema_json } = req.body;
    const changes = {};

    if (name !== undefined) changes.name = name;
    if (schema_json !== undefined) changes.schema_json = schema_json;

    const { data, error } = await supabase
      .from('templates')
      .update(changes)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { force } = req.query;

    const { count, error: countError } = await supabase
      .from('receipts')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', req.params.id);

    if (countError) throw countError;

    if (count > 0 && force !== 'true') {
      return res.status(409).json({ error: 'Receipts exist', count });
    }

    if (count > 0 && force === 'true') {
      const { error: updateError } = await supabase
        .from('templates')
        .update({ is_archived: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
      if (updateError) throw updateError;
      return res.status(204).send();
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const seedWelcomeTemplate = async (req, res, next) => {
  try {
    // 1. Check if user already has any templates
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('templates')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1);

    if (fetchError) throw fetchError;

    // 2. If user has 0 templates, seed the welcome template
    if (!existingTemplates || existingTemplates.length === 0) {
      const record = {
        name: 'Receipt Template',
        schema_json: welcomeTemplateSchema,
        user_id: req.user.id,
      };

      const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert(record)
        .select()
        .single();

      if (insertError) throw insertError;
      return res.status(201).json(newTemplate);
    }

    // 3. Else, return 200 OK
    return res.status(200).json({ message: 'User already has templates.', exists: true });
  } catch (err) {
    next(err);
  }
};

