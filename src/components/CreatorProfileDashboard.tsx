import React from 'react';
import { useParams } from 'react-router-dom';
import { useCreatorProfile } from '../hooks/useCreatorProfile';
import { useAlerts } from '../hooks/useAlerts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4e79a7', '#f28e2b', '#e15759'];

export default function CreatorProfileDashboard() {
    const { id } = useParams<{ id: string }>();
    const month = new Date().toISOString().slice(0, 7);
    const { profile, daily, loading, error } = useCreatorProfile(id || '', month);
    const { alerts } = useAlerts(id || '', month);

    if (loading) return <div className="card">Cargando perfil...</div>;
    if (error) return <div className="card">Error al cargar datos.</div>;
    if (!profile) return <div className="card">Sin datos para este creador.</div>;

    const pieData = [
        { name: 'Días LIVE', value: profile.liveDays },
        { name: 'Días sin LIVE', value: profile.metaDiasMes ? profile.metaDiasMes - profile.liveDays : 0 },
    ];

    return (
        <div className="container">
            <h1>Perfil del Creador</h1>
            {/* Placeholder for creator details if not in profile yet */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ccc' }}></div>
                <div>
                    <h2>{profile.username || 'Usuario'}</h2>
                    <p>Nivel: {profile.nivel_actual || '-'}</p>
                </div>
            </div>

            <h2>KPI del Mes</h2>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem' }}>
                <div className="card"><h4>Diamantes</h4><p>{profile.diamonds?.toLocaleString()}</p></div>
                <div className="card"><h4>Horas LIVE</h4><p>{profile.hours?.toFixed(1)}</p></div>
                <div className="card"><h4>Días LIVE</h4><p>{profile.liveDays}</p></div>
                <div className="card"><h4>Progreso Días</h4><p>{profile.metaDiasMes ? ((profile.liveDays / profile.metaDiasMes) * 100).toFixed(1) + '%' : '-'}</p></div>
                <div className="card"><h4>Progreso Horas</h4><p>{profile.metaHorasMes ? ((profile.hours / profile.metaHorasMes) * 100).toFixed(1) + '%' : '-'}</p></div>
            </div>

            <h2>Alertas Personalizadas</h2>
            {alerts.length === 0 ? <p>Todo en orden.</p> : (
                <ul>
                    {alerts.map((a, i) => <li key={i} style={{ color: '#e15759' }}>{a}</li>)}
                </ul>
            )}

            <h2>Gráficos</h2>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '1rem' }}>
                <div className="card" style={{ height: 300 }}>
                    <h4>Diamantes diarios</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={daily.map(d => ({ date: d.fecha, diamonds: Number(d.diamonds_dia) }))}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="diamonds" stroke={COLORS[0]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Horas LIVE por día</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={daily.map(d => ({ date: d.fecha, hours: Number(d.live_hours_dia) }))}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="hours" stroke={COLORS[1]} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 300 }}>
                    <h4>Días LIVE vs No LIVE</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <h2>Detalle Diario</h2>
            <table className="card" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Diamantes</th>
                        <th>Horas LIVE</th>
                        <th>Live?</th>
                        <th>Nuevos Followers</th>
                    </tr>
                </thead>
                <tbody>
                    {daily.map((d, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                            <td>{d.fecha}</td>
                            <td>{Number(d.diamonds_dia).toLocaleString()}</td>
                            <td>{Number(d.live_hours_dia).toFixed(1)}</td>
                            <td>{d.hizo_live ? 'Sí' : 'No'}</td>
                            <td>{d.new_followers_dia}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
