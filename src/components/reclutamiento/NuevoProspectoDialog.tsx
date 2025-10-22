import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NuevoProspectoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NuevoProspectoDialog = ({ open, onOpenChange }: NuevoProspectoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Prospecto</DialogTitle>
        </DialogHeader>
        <div className="p-8 text-center text-muted-foreground">
          <p>En desarrollo</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
