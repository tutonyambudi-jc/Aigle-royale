import { prisma } from '@/lib/prisma'

export type ServiceFeeMode = 'NONE' | 'FIXED' | 'PERCENT'

export interface ServiceFeeConfig {
  enabled: boolean
  mode: ServiceFeeMode
  value: number
}

const DEFAULT_CONFIG: ServiceFeeConfig = {
  enabled: false,
  mode: 'NONE',
  value: 0,
}

function toBool(raw?: string): boolean {
  if (!raw) return false
  return raw === 'true' || raw === '1' || raw.toLowerCase() === 'yes'
}

function toNumber(raw?: string): number {
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeMode(raw?: string): ServiceFeeMode {
  if (raw === 'FIXED' || raw === 'PERCENT' || raw === 'NONE') return raw
  return 'NONE'
}

export async function getServiceFeeConfig(): Promise<ServiceFeeConfig> {
  const keys = ['serviceFeeEnabled', 'serviceFeeMode', 'serviceFeeValue']
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  })

  const map = new Map(settings.map((s) => [s.key, s.value]))
  const enabled = toBool(map.get('serviceFeeEnabled'))
  const mode = normalizeMode(map.get('serviceFeeMode'))
  const value = Math.max(0, toNumber(map.get('serviceFeeValue')))

  if (!enabled || mode === 'NONE' || value <= 0) return DEFAULT_CONFIG
  return { enabled, mode, value }
}

export function computeServiceFee(subtotal: number, config: ServiceFeeConfig): number {
  if (!config.enabled || subtotal <= 0) return 0
  if (config.mode === 'FIXED') return Math.max(0, config.value)
  if (config.mode === 'PERCENT') return Math.max(0, (subtotal * config.value) / 100)
  return 0
}
