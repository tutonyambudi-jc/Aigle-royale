import { redirect } from 'next/navigation'

export default function LogisticsManageRedirect() {
    redirect('/logistics?tab=parcels')
}
