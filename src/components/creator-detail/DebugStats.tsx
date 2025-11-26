import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DebugStats = ({ creatorId }: { creatorId: string }) => {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase
                .from('creator_daily_stats')
                .select('fecha, diamantes, creator_id')
                .eq('creator_id', creatorId)
                .order('fecha', { ascending: false })
                .limit(5);
            setStats(data || []);
        };
        fetchStats();
    }, [creatorId]);

    return (
        <div className="space-y-1 border-t border-white/10 pt-2 mt-2">
            <p className="font-bold text-blue-400">Últimos 5 registros en daily_stats:</p>
            {stats.map((s, i) => (
                <div key={i} className="flex justify-between">
                    <span>{s.fecha}:</span>
                    <span className="text-yellow-400">{s.diamantes?.toLocaleString()} 💎</span>
                </div>
            ))}
        </div>
    );
};
