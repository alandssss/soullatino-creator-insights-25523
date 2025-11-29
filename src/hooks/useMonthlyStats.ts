import { useEffect, useState } from 'react';
import { getMonthlyMetrics } from '../helpers/queries';
import type { CreatorDailyStat } from '@/types/dashboard';

export function useMonthlyStats(month: string) {
    const [data, setData] = useState<CreatorDailyStat[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getMonthlyMetrics(month)
            .then(res => setData(res))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [month]);

    return { data, loading, error };
}
