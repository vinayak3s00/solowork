import { getDb } from '../mongo'
import { json } from '../http'
import { requireAuth } from '../auth/session'

export async function getAnalytics(request) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    leadsThisWeek,
    totalLeads,
    leadsByStatusRaw,
    revenueData,
    convertedCount,
    pendingReminders,
  ] = await Promise.all([
    db.collection('leads').countDocuments({ ownerId, createdAt: { $gte: weekAgo } }),
    db.collection('leads').countDocuments({ ownerId }),
    db
      .collection('leads')
      .aggregate([{ $match: { ownerId } }, { $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray(),
    db
      .collection('payments')
      .aggregate([
        { $match: { ownerId, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray(),
    db.collection('leads').countDocuments({ ownerId, status: { $in: ['Done', 'Paid'] } }),
    db
      .collection('reminders')
      .countDocuments({ ownerId, completed: false, dueDate: { $lte: now } }),
  ])

  const totalRevenue = revenueData[0]?.total || 0
  const conversionRate =
    totalLeads > 0 ? parseFloat(((convertedCount / totalLeads) * 100).toFixed(1)) : 0

  const leadsByStatus = leadsByStatusRaw.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})

  return json({
    leadsThisWeek,
    totalLeads,
    leadsByStatus,
    totalRevenue,
    conversionRate,
    pendingReminders,
  })
}
