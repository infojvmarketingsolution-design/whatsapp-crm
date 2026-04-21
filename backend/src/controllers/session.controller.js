const UserSession = require('../models/core/UserSession');

/**
 * @desc    Get all session logs
 * @route   GET /api/sessions
 * @access  Private/Admin
 */
const getSessions = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;
    
    const query = req.user.role === 'SUPER_ADMIN' ? {} : { tenantId: req.user.tenantId };

    const count = await UserSession.countDocuments(query);
    const sessions = await UserSession.find(query)
      .sort({ loginAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ sessions, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSessions };
