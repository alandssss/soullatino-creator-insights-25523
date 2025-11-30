import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Creator = Tables<'creators'>;

export const CreatorTable = () => {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const { toast } = useToast();

    const fetchCreators = async (pageNumber: number) => {
        setLoading(true);
        setError(null);
        try {
            const from = (pageNumber - 1) * pageSize;
            const to = from + pageSize - 1;
            const { data, error } = await supabase
                .from('creators')
                .select('*')
                .order('nombre', { ascending: true })
                .range(from, to);
            if (error) throw error;
            setCreators(data || []);
        } catch (e: any) {
            console.error('Error fetching creators:', e);
            setError(e.message || 'Error al cargar creadores');
            toast({
                title: 'Error',
                description: e.message || 'No se pudieron cargar los creadores',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCreators(page);
    }, [page]);

    const totalPages = 100; // Placeholder, you could query count for exact pages

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Cargando creadores...
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Usuario TikTok</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Grupo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {creators.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.nombre}</TableCell>
                                <TableCell>{c.tiktok_username}</TableCell>
                                <TableCell>{c.telefono || '-'} </TableCell>
                                <TableCell>{c.grupo || '-'} </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            <div className="flex justify-between items-center mt-2">
                <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                    Anterior
                </Button>
                <span className="text-sm">Página {page}</span>
                <Button variant="outline" size="sm" disabled={creators.length < pageSize || loading} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
};
