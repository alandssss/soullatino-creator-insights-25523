import { useMemo } from "react";
import { BonificacionesPanel } from "@/components/BonificacionesPanel";

interface CreatorBonusesProps {
  creatorId: string;
  creatorName: string;
}

export function CreatorBonuses({ creatorId, creatorName }: CreatorBonusesProps) {
  // Memoizar para evitar re-renders innecesarios
  const memoizedPanel = useMemo(
    () => <BonificacionesPanel creatorId={creatorId} creatorName={creatorName} />,
    [creatorId, creatorName]
  );

  return memoizedPanel;
}
