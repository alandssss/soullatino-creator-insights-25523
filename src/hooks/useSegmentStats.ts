import { useEffect, useState } from 'react';
import { getSegmentsKPIs } from '../helpers/queries';

export function useSegmentStats(month: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getSegmentsKPIs(month)
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [month]);

    return { data, loading, error };
}
