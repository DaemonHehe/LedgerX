export const getHealth = (_req, res) => {
  res.json({ ok: true });
};

export const getMe = (req, res) => {
  // req.user was populated by requireAuth middleware
  res.json(req.user);
};
