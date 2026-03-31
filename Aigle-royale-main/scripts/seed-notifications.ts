import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      role: true,
    },
    take: 20,
  })

  if (users.length === 0) {
    console.log('Aucun utilisateur actif trouve. Lancez d abord npm run db:seed.')
    return
  }

  const admin = users.find((user) => user.role === 'ADMINISTRATOR') || users[0]

  const campaigns = [
    {
      title: 'Information trafic',
      message: 'Retards legers prevus ce matin sur certains trajets. Merci pour votre comprehension.',
      channels: 'SMS,APP',
      audience: 'ACTIVE_USERS',
      status: 'COMPLETED',
    },
    {
      title: 'Promo weekend',
      message: 'Profitez de -10% sur vos reservations weekend avec le code WEEKEND10.',
      channels: 'EMAIL,WHATSAPP,APP',
      audience: 'ALL_USERS',
      status: 'COMPLETED',
    },
    {
      title: 'Maintenance application',
      message: 'Une operation de maintenance est prevue ce soir de 23h a 23h30.',
      channels: 'APP',
      audience: 'ALL_USERS',
      status: 'COMPLETED',
    },
  ] as const

  let totalLogs = 0
  let totalInApp = 0

  for (const campaignData of campaigns) {
    const campaign = await prisma.notificationCampaign.create({
      data: {
        ...campaignData,
        createdById: admin.id,
      },
      select: { id: true, channels: true, title: true, message: true },
    })

    const channels = campaign.channels.split(',').map((channel) => channel.trim()).filter(Boolean)
    let sent = 0

    for (const user of users) {
      for (const channel of channels) {
        const recipient = channel === 'EMAIL' ? user.email : user.phone
        const hasRecipient = channel === 'APP' || Boolean(recipient)
        if (!hasRecipient) continue

        await prisma.notificationLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            channel,
            recipient: recipient || user.id,
            title: campaign.title,
            message: campaign.message,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
        totalLogs++
        sent++

        if (channel === 'APP') {
          await prisma.appNotification.create({
            data: {
              userId: user.id,
              title: campaign.title,
              message: campaign.message,
              type: 'INFO',
              isRead: false,
            },
          })
          totalInApp++
        }
      }
    }

    await prisma.notificationCampaign.update({
      where: { id: campaign.id },
      data: {
        totalTargets: users.length,
        totalSent: sent,
        totalFailed: 0,
      },
    })
  }

  console.log(`SEED_NOTIFICATIONS_OK users=${users.length} campaigns=${campaigns.length} logs=${totalLogs} inApp=${totalInApp}`)
}

main()
  .catch((error) => {
    console.error('SEED_NOTIFICATIONS_ERROR', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
