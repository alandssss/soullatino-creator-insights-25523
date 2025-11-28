import { useState, useEffect } from "react";
import { creatorAnalytics } from "@/services/creatorAnalytics";

interface BonificacionData {
    creator_id: string;
    dias_live_mes: number;
    horas_live_mes: number;
    diam_live_mes: number;
    meta_recomendada?: string;
    proximo_objetivo_valor?: string;
    texto_creador?: string;
    monto_bonificacion?: number;
    probabilidad?: number;
    nivel?: string;
}

export const useBonificacionData = (creatorId: string) => {
    const [data, setData] = useState<BonificacionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const mesActual = new Date();
                const mesReferencia = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-01`;

                const bonificaciones: any[] = await creatorAnalytics.getBonificaciones(mesReferencia);
                const bonifCreator: any = bonificaciones.find((b: any) => b.creator_id === creatorId);

                if (bonifCreator) {
                    const diasRealesData: any = await creatorAnalytics.getDiasRealesMes(creatorId);
                    if (diasRealesData) {
                        bonifCreator.dias_live_mes = diasRealesData.dias_reales_hasta_hoy || bonifCreator.dias_live_mes;
                        bonifCreator.horas_live_mes = diasRealesData.horas_totales_mes || bonifCreator.horas_live_mes;
                    }
                }

                setData(bonifCreator || null);
            } catch (error) {
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        if (creatorId) {
            loadData();
        }
    }, [creatorId]);

    return { data, loading };
};
