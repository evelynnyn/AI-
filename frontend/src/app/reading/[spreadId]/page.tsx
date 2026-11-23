import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReadingFlow } from "@/components/reading/reading-flow";
import { SPREADS, SPREAD_LIST, isSpreadId } from "@/lib/tarot/spreads";

type Params = { params: Promise<{ spreadId: string }> };

export function generateStaticParams() {
  return SPREAD_LIST.map((s) => ({ spreadId: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { spreadId } = await params;
  return isSpreadId(spreadId)
    ? { title: `${SPREADS[spreadId].nameZh} · 星語塔羅` }
    : {};
}

/** The reading for one spread; open to guests. */
export default async function ReadingPage({ params }: Params) {
  const { spreadId } = await params;
  if (!isSpreadId(spreadId)) notFound();
  return <ReadingFlow spreadId={spreadId} />;
}
