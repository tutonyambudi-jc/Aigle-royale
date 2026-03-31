import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications'

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'APP'

type SendCampaignInput = {
  title: string
  message: string
  channels: NotificationChannel[]
  audience: 'ALL_USERS' | 'ACTIVE_USERS'
  createdById?: string
}

function parseChannels(channels: NotificationChannel[]) {
  return Array.from(new Set(channels)).join(',')
}

export async function sendNotificationCampaign(input: SendCampaignInput) {
  const users = await prisma.user.findMany({
    where:
      input.audience === 'ACTIVE_USERS'
        ? { isActive: true }
        : undefined,
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
    },
  })

  const campaign = await prisma.notificationCampaign.create({
    data: {
      title: input.title,
      message: input.message,
      channels: parseChannels(input.channels),
      audience: input.audience,
      status: 'IN_PROGRESS',
      totalTargets: users.length,
      createdById: input.createdById || null,
    },
    select: { id: true },
  })

  let sent = 0
  let failed = 0

  for (const user of users) {
    for (const channel of input.channels) {
      const recipient = channel === 'EMAIL' ? user.email : user.phone
      if ((channel === 'EMAIL' || channel === 'SMS' || channel === 'WHATSAPP') && !recipient) {
        continue
      }

      try {
        if (channel === 'EMAIL' && user.email) {
          await NotificationService.sendEmail({
            to: user.email,
            subject: input.title,
            html: `<p>Bonjour ${user.firstName || 'Client'},</p><p>${input.message}</p>`,
          })
        } else if (channel === 'SMS' && user.phone) {
          await NotificationService.sendSMS({
            to: user.phone,
            message: `${input.title}: ${input.message}`.slice(0, 300),
          })
        } else if (channel === 'WHATSAPP' && user.phone) {
          await NotificationService.sendWhatsApp({
            to: user.phone,
            message: `${input.title}\n${input.message}`,
          })
        } else if (channel === 'APP') {
          await prisma.appNotification.create({
            data: {
              userId: user.id,
              title: input.title,
              message: input.message,
              type: 'INFO',
            },
          })
        }

        await prisma.notificationLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            channel,
            recipient: recipient || user.id,
            title: input.title,
            message: input.message,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
        sent++
      } catch (error) {
        await prisma.notificationLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            channel,
            recipient: recipient || user.id,
            title: input.title,
            message: input.message,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
          },
        })
        failed++
      }
    }
  }

  await prisma.notificationCampaign.update({
    where: { id: campaign.id },
    data: {
      status: 'COMPLETED',
      totalSent: sent,
      totalFailed: failed,
    },
  })

  return { campaignId: campaign.id, totalTargets: users.length, totalSent: sent, totalFailed: failed }
}
