import { useEffect, useState } from 'react';
import { getCreatorMonthlyRollup, getCreatorDailyHistory } from '../helpers/queries';

export function useCreatorProfile(creatorId: string, month: string) {
    const [profile, setProfile] = useState<any>(null);
    const [daily, setDaily] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!creatorId) return;
        async function fetch() {
            try {
                const [rollup, dailyData] = await Promise.all([
                    getCreatorMonthlyRollup(creatorId, month),
                    getCreatorDailyHistory(creatorId),
                ]);
                setProfile(rollup);
                setDaily(dailyData);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [creatorId, month]);

    return { profile, daily, loading, error };
}
