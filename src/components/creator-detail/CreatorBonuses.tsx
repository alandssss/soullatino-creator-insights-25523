import { useMemo } from "react";
import { BonificacionesPanel } from "@/components/BonificacionesPanel";

interface CreatorBonusesProps {
  creatorId: string;
  creatorName: string;
  tiktok_username?: string;
}

export function CreatorBonuses({ creatorId, creatorName, tiktok_username }: CreatorBonusesProps) {
  // Memoizar para evitar re-renders innecesarios
  const memoizedPanel = useMemo(
    () => <BonificacionesPanel creatorId={creatorId} creatorName={creatorName} tiktok_username={tiktok_username} />,
    [creatorId, creatorName, tiktok_username]
  );

  return memoizedPanel;
}
