import { evaluateCreatorAlerts } from '../helpers/alerts';
import { useCreatorProfile } from './useCreatorProfile';

export function useAlerts(creatorId: string, month: string) {
    const { profile, loading, error } = useCreatorProfile(creatorId, month);
    const alerts = profile ? evaluateCreatorAlerts(profile) : [];
    return { alerts, loading, error };
}
