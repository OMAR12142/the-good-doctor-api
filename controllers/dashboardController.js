const Session = require('../models/Session');
const catchAsync = require('../utils/catchAsync');

/**
 * Dashboard Stats (Multi-tenant)
 *
 * Aggregates stats scoped to the authenticated doctor (req.user.id).
 * Current stats:
 * - totalRevenue: sum of all Session.amountPaid for this doctor
 * - totalPersonalEarnings: sum of all Session.myCommission for this doctor
 */
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [agg] = await Session.aggregate([
    {
      // Multi-tenancy MUST be enforced at the database level for aggregation.
      $match: { doctorId: req.user.id },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $ifNull: ['$amountPaid', 0] } },
        totalPersonalEarnings: { $sum: { $ifNull: ['$myCommission', 0] } },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue: agg?.totalRevenue || 0,
      totalPersonalEarnings: agg?.totalPersonalEarnings || 0,
    },
  });
});

