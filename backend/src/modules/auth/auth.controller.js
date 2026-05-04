const authService = require('./auth.service');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout };
