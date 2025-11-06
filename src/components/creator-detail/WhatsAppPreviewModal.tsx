import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { NeoButton } from '@/components/neo/NeoButton';
import { NeoInput } from '@/components/neo/NeoInput';
import { NeoCard } from '@/components/neo/NeoCard';
import { normalizePhoneE164, waLink } from '@/utils/whatsapp';
import { MessageSquare, ExternalLink, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMessage: string;
  defaultPhone?: string;
  creatorName: string;
}

export function WhatsAppPreviewModal({
  open,
  onOpenChange,
  defaultMessage,
  defaultPhone,
  creatorName
}: WhatsAppPreviewModalProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(defaultMessage);
  const [phoneError, setPhoneError] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);
  
  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);
  
  const validatePhone = (value: string): boolean => {
    const e164 = normalizePhoneE164(value);
    if (!e164) {
      setPhoneError('Número inválido. Formato E.164 requerido (ej: +52 1234567890)');
      return false;
    }
    if (e164.length < 10 || e164.length > 15) {
      setPhoneError('El número debe tener entre 10 y 15 dígitos');
      return false;
    }
    setPhoneError('');
    return true;
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "Mensaje copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el mensaje",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenWhatsApp = () => {
    if (!validatePhone(phone)) {
      toast({
        title: "Error",
        description: phoneError,
        variant: "destructive"
      });
      return;
    }
    
    const e164 = normalizePhoneE164(phone);
    if (!e164) return;
    
    const url = waLink(e164, message);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "WhatsApp abierto",
      description: "Se abrió una nueva pestaña con el mensaje prellenado",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Vista Previa de WhatsApp - {creatorName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Input de teléfono */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Para: <span className="text-muted-foreground">(Formato E.164)</span>
            </label>
            <NeoInput
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                validatePhone(e.target.value);
              }}
              placeholder="+52 1234567890"
              error={!!phoneError}
            />
            {phoneError && (
              <p className="text-xs text-destructive mt-1">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ejemplo: +52 (México), +57 (Colombia), +58 (Venezuela)
            </p>
          </div>
          
          {/* Preview del mensaje */}
          <NeoCard variant="elevated" padding="md">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold">Mensaje</h4>
              <NeoButton
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </NeoButton>
            </div>
            <div className="bg-neo-pressed p-4 rounded-xl text-sm whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
              {message}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {message.length} caracteres • WhatsApp soporta hasta ~4096 caracteres
            </p>
          </NeoCard>
          
          {/* Aviso */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-muted-foreground border border-blue-200 dark:border-blue-800">
            ℹ️ Se abrirá una nueva pestaña con WhatsApp Web/App. El mensaje estará prellenado pero NO se enviará automáticamente.
          </div>
        </div>
        
        <DialogFooter>
          <NeoButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </NeoButton>
          <NeoButton
            variant="primary"
            onClick={handleOpenWhatsApp}
            aria-label="Enviar por WhatsApp"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir WhatsApp
          </NeoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
