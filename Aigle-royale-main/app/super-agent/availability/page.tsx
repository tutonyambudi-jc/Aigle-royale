import { redirect } from 'next/navigation'

export default function AvailabilityRedirect() {
    redirect('/super-agent?tab=sell')
}
