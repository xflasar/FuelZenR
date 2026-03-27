import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import FuelExplorer from '@/components/FuelExplorer';

export default async function Dashboard() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return <FuelExplorer />;
}