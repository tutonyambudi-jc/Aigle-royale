import { redirect } from 'next/navigation'

export default function ReservationsRedirect() {
    redirect('/super-agent?tab=sales')
}
