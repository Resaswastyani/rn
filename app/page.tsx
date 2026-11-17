import { connection } from 'next/server'
import { RangkaiDashboard } from '@/components/rangkai-dashboard'
import { getDashboard } from '@/lib/data'

export default async function Page() {
  // Data selalu dibaca langsung dari database Neon pada setiap permintaan.
  await connection()
  const data = await getDashboard()
  return <RangkaiDashboard {...data} />
}
