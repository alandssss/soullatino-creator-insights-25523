import React from 'react';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { useSegmentStats } from '../hooks/useSegmentStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949'];

export default function DashboardGlobal() {
    const month = new Date().toISOString().slice(0, 7);
    const { data: dailyStats, loading: loadingDaily, error: errDaily } = useMonthlyStats(month);
    const { data: segmentKPIs, loading: loadingSeg, error: errSeg } = useSegmentStats(month);

    if (loadingDaily || loadingSeg) return <div className="card">Cargando métricas globales...</div>;
    if (errDaily || errSeg) return <div className="card">Error al cargar datos.</div>;

    const totalCreators = new Set(dailyStats?.map(d => d.creator_id)).size;
    const totalDiamonds = dailyStats?.reduce((a, b) => a + Number(b.diamonds_dia), 0) ?? 0;
    const totalHours = dailyStats?.reduce((a, b) => a + Number(b.live_hours_dia), 0) ?? 0;
    const avgLiveDays = dailyStats?.filter(d => d.hizo_live).length / (totalCreators || 1);

    const creatorMap = new Map<string, { diamonds: number; hours: number }>();
    dailyStats?.forEach(d => {
        const entry = creatorMap.get(d.creator_id) ?? { diamonds: 0, hours: 0 };
        entry.diamonds += Number(d.diamonds_dia);
        entry.hours += Number(d.live_hours_dia);
        creatorMap.set(d.creator_id, entry);
    });
    const diamondsByCreator = Array.from(creatorMap.entries()).map(([id, v]) => ({ creator: id, diamonds: v.diamonds }));
    const hoursByCreator = Array.from(creatorMap.entries()).map(([id, v]) => ({ creator: id, hours: v.hours }));

    const segmentData = Object.entries(segmentKPIs ?? {}).map(([seg, val]: any) => ({ name: seg, value: val.totalCreators }));

    return (
        <div className="container">
            <h1>Dashboard Global</h1>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="card"><h3>Total Creadores</h3><p>{totalCreators}</p></div>
                <div className="card"><h3>Diamantes Mensuales</h3><p>{totalDiamonds.toLocaleString()}</p></div>
                <div className="card"><h3>Horas LIVE Mensuales</h3><p>{totalHours.toFixed(1)}</p></div>
                <div className="card"><h3>Promedio Días LIVE / creador</h3><p>{avgLiveDays.toFixed(2)}</p></div>
            </div>

            <h2>Gráficos</h2>
            <div className="grid" style={{ marginTop: '2rem', gap: '2rem' }}>
                <div className="card" style={{ height: 300 }}>
                    <h4>Diamantes por creador</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={diamondsByCreator} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="creator" type="category" width={80} />
                            <Tooltip />
                            <Bar dataKey="diamonds" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Horas LIVE por creador</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hoursByCreator} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="creator" type="category" width={80} />
                            <Tooltip />
                            <Bar dataKey="hours" fill={COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Distribución por segmento</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={segmentData} dataKey="value" nameKey="name" outerRadius={80} label>
                                {segmentData.map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Evolución diaria de diamantes</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyStats?.map(d => ({ date: d.fecha, diamonds: Number(d.diamonds_dia) }))}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="diamonds" stroke={COLORS[2]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Evolución diaria de horas LIVE</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyStats?.map(d => ({ date: d.fecha, hours: Number(d.live_hours_dia) }))}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="hours" stroke={COLORS[3]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
