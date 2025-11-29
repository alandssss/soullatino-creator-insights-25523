import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Creator } from '@/types/dashboard';

interface AlertRow {
    username: string;
    problema: string;
    diamonds: number;
    progreso: string;
}

export default function AlertasOperativas() {
    const [rows, setRows] = useState<AlertRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                const { data: creators, error } = await supabase.from('creators').select('id,username,meta_dias_mes,meta_horas_mes');
                if (error) throw error;
                const alerts: AlertRow[] = [];
                for (const c of creators as any[]) {
                    const stats = await supabase
                        .from('creator_daily_stats')
                        .select('diamonds_dia,live_hours_dia,hizo_live')
                        .eq('creator_id', c.id);
                    if (stats.error) continue;
                    const totalDiamonds = (stats.data as any[]).reduce((a, b) => a + Number(b.diamonds_dia), 0);
                    const totalHours = (stats.data as any[]).reduce((a, b) => a + Number(b.live_hours_dia), 0);
                    const liveDays = (stats.data as any[]).filter(d => d.hizo_live).length;
                    const progDias = c.meta_dias_mes ? liveDays / c.meta_dias_mes : 0;
                    const progHoras = c.meta_horas_mes ? totalHours / c.meta_horas_mes : 0;
                    if (progDias < 0.5) alerts.push({ username: c.username, problema: 'Bajo número de días LIVE', diamonds: totalDiamonds, progreso: `${(progDias * 100).toFixed(0)}% ` });
                    if (progHoras < 0.5) alerts.push({ username: c.username, problema: 'Bajas horas LIVE', diamonds: totalDiamonds, progreso: `${(progHoras * 100).toFixed(0)}% ` });
                    if (totalDiamonds < 20000) alerts.push({ username: c.username, problema: 'Nivel bajo de monetización', diamonds: totalDiamonds, progreso: '-' });
                }
                setRows(alerts);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading) return <div className="card">Cargando alertas operativas...</div>;
    if (error) return <div className="card">Error: {error}</div>;

    return (
        <div className="container">
            <h1>Alertas Operativas</h1>
            <table className="card" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Problema Detectado</th>
                        <th>Diamantes Mes</th>
                        <th>Progreso</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                            <td>{r.username}</td>
                            <td>{r.problema}</td>
                            <td>{r.diamonds.toLocaleString()}</td>
                            <td>{r.progreso}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
