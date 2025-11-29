import React, { useState } from 'react';
import { useSegmentStats } from '../hooks/useSegmentStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SEGMENTS = [
    { label: 'Incubadora', key: 'incubadora' },
    { label: 'Profesionalización', key: 'profesionalizacion' },
    { label: 'Élite', key: 'elite' },
];

const COLORS = ['#4e79a7', '#f28e2b', '#e15759'];

export default function DashboardSegmento() {
    const month = new Date().toISOString().slice(0, 7);
    const { data: segmentKPIs, loading, error } = useSegmentStats(month);
    const [active, setActive] = useState('incubadora');

    if (loading) return <div className="card">Cargando datos de segmento...</div>;
    if (error) return <div className="card">Error al cargar datos.</div>;

    const segData = segmentKPIs?.[active] ?? {};

    // Placeholder data for tables/graphs – you can replace with real joins later
    const barData = [];
    const lineData = [];
    const pieData = [
        { name: 'Horas vs Meta', value: segData.totalHours || 0 },
        { name: 'Resto', value: segData.metaHorasMes ? segData.metaHorasMes - (segData.totalHours || 0) : 0 },
    ];

    return (
        <div className="container">
            <h1>Dashboard por Segmento</h1>
            <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {SEGMENTS.map(s => (
                    <button
                        key={s.key}
                        onClick={() => setActive(s.key)}
                        style={{
                            background: active === s.key ? '#4e79a7' : undefined,
                            color: active === s.key ? '#fff' : undefined,
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <h2>{SEGMENTS.find(s => s.key === active)?.label}</h2>
            <div className="card">
                <h3>KPIs del Segmento</h3>
                <ul>
                    <li>Total Creadores: {segData.totalCreators}</li>
                    <li>Diamantes Totales: {segData.totalDiamonds?.toLocaleString()}</li>
                    <li>Horas LIVE Totales: {segData.totalHours?.toFixed(1)}</li>
                    <li>Promedio Días LIVE: {segData.avgLiveDays?.toFixed(2)}</li>
                </ul>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <div className="card" style={{ height: 300 }}>
                    <h4>Diamantes (mes) – Barras</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <XAxis dataKey="creator" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="diamonds" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Horas LIVE (día) – Líneas</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lineData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="hours" fill={COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Progreso Horas vs Meta – Pie</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                {pieData.map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
