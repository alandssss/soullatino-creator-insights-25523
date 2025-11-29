import React, { useEffect, useState } from 'react';
import { getHitosKPIs } from '../helpers/queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HitosPanel() {
    const month = new Date().toISOString().slice(0, 7);
    const [data, setData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getHitosKPIs(month)
            .then(res => setData(res))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [month]);

    if (loading) return <div className="card">Cargando hitos...</div>;
    if (error) return <div className="card">Error: {error}</div>;

    const chartData = Object.entries(data).map(([k, v]) => ({ milestone: `${k}+`, creators: v }));

    return (
        <div className="container">
            <h1>Panel de Hitos del Mes</h1>
            <div className="card" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="milestone" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="creators" fill="#4e79a7" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
