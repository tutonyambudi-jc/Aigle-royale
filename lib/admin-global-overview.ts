import { prisma } from '@/lib/prisma'

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

export type AdminGlobalModuleOverview = {
  bookingsPending: number
  bookingsConfirmed: number
  routesActive: number
  tripsActive: number
  busesActive: number
  busCompanies: number
  freightOrders: number
  agencies: number
  driversActive: number
  mealsActive: number
  passengerPricingRules: number
  cityStops: number
  offersActive: number
  travelVouchersTotal: number
  commissionsPending: number
  rentalsPending: number
  adsActive: number
  adInquiriesPending: number
  usersTotal: number
  usersClients: number
  companyReviewsTotal: number
  companyReviewsHidden: number
  manifestSharesActive: number
  notificationCampaigns: number
  notificationLogsSent30d: number
  appNotificationsUnread: number
  supportComplaintsOpen: number
  supportComplaintsTotal: number
  loyaltyTransactions: number
  serviceFeeEnabled: boolean
}

/**
 * Synthèse chiffrée de tous les modules principaux pour le tableau de bord admin.
 */
export async function getAdminGlobalModuleOverview(): Promise<AdminGlobalModuleOverview> {
  const d30 = daysAgo(30)

  const [
    bookingsPending,
    bookingsConfirmed,
    routesActive,
    tripsActive,
    busesActive,
    busCompanies,
    freightOrders,
    agencies,
    driversActive,
    mealsActive,
    passengerPricingRules,
    cityStops,
    offersActive,
    travelVouchersTotal,
    commissionsPending,
    rentalsPending,
    adsActive,
    adInquiriesPending,
    usersTotal,
    usersClients,
    companyReviewsTotal,
    companyReviewsHidden,
    manifestSharesActive,
    notificationCampaigns,
    notificationLogsSent30d,
    appNotificationsUnread,
    supportComplaintsOpen,
    supportComplaintsTotal,
    loyaltyTransactions,
    serviceFeeSetting,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.trip.count({ where: { isActive: true } }),
    prisma.bus.count({ where: { isActive: true } }),
    prisma.busCompany.count(),
    prisma.freightOrder.count(),
    prisma.agency.count({ where: { isActive: true } }),
    prisma.driver.count({ where: { isActive: true } }),
    prisma.meal.count({ where: { isActive: true } }),
    prisma.passengerPricing.count({ where: { isActive: true } }),
    prisma.cityStop.count({ where: { isActive: true } }),
    prisma.offer.count({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.travelVoucher.count(),
    prisma.commission.count({ where: { status: 'PENDING' } }),
    prisma.busRental.count({ where: { status: 'PENDING' } }),
    prisma.advertisement.count({ where: { status: 'ACTIVE' } }),
    prisma.advertisementInquiry.count({ where: { status: 'PENDING' } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.companyReview.count(),
    prisma.companyReview.count({ where: { isVisible: false } }),
    prisma.manifestShare.count({ where: { expiresAt: { gte: new Date() } } }),
    prisma.notificationCampaign.count(),
    prisma.notificationLog.count({
      where: { status: 'SENT', createdAt: { gte: d30 } },
    }),
    prisma.appNotification.count({ where: { isRead: false } }),
    prisma.supportComplaint.count({ where: { status: 'OPEN' } }),
    prisma.supportComplaint.count(),
    prisma.loyaltyTransaction.count(),
    prisma.setting.findUnique({ where: { key: 'serviceFeeEnabled' } }),
  ])

  return {
    bookingsPending,
    bookingsConfirmed,
    routesActive,
    tripsActive,
    busesActive,
    busCompanies,
    freightOrders,
    agencies,
    driversActive,
    mealsActive,
    passengerPricingRules,
    cityStops,
    offersActive,
    travelVouchersTotal,
    commissionsPending,
    rentalsPending,
    adsActive,
    adInquiriesPending,
    usersTotal,
    usersClients,
    companyReviewsTotal,
    companyReviewsHidden,
    manifestSharesActive,
    notificationCampaigns,
    notificationLogsSent30d,
    appNotificationsUnread,
    supportComplaintsOpen,
    supportComplaintsTotal,
    loyaltyTransactions,
    serviceFeeEnabled: serviceFeeSetting?.value === 'true',
  }
}
