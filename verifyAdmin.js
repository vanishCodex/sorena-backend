// verifyAdmin.js
const jwt = require('jsonwebtoken');

module.exports = function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'توکن موجود نیست' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'توکن نامعتبر است' });
  }
};
