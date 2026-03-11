import { db } from '@/db';
import { magiStates, dispatches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { MagiState } from '@/types/magi';
import MagiDetailPanel from '@/components/MagiDetailPanel';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ magiId: string }>;
}

export default async function MagiDetailPage({ params }: Props) {
  const { magiId } = await params;
  const id = magiId.toUpperCase();

  const [row] = await db
    .select()
    .from(magiStates)
    .where(eq(magiStates.id, id));

  if (!row) notFound();

  const recentDispatches = await db
    .select()
    .from(dispatches)
    .where(eq(dispatches.magiId, id))
    .orderBy(desc(dispatches.createdAt))
    .limit(10);

  return (
    <MagiDetailPanel
      magiId={id}
      state={row.state as MagiState}
      recentDispatches={recentDispatches}
    />
  );
}
