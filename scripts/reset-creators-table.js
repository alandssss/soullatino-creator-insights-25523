import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetCreatorsTable() {
    console.log('🧹 Reseteando valores en tabla creators...\n');

    // Resetear diamantes, días y horas a 0 para TODOS los creadores
    const { error, count } = await supabase
        .from('creators')
        .update({
            diamantes: 0,
            dias_live: 0,
            horas_live: 0
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Actualizar todos excepto un ID imposible

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Reseteados ${count || 0} creadores\n`);
        console.log('✅ ¡Listo! Ahora sube el Excel de nuevo y debería mostrar los valores correctos.');
    }
}

resetCreatorsTable().catch(console.error);
