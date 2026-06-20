import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface ServerExportButtonProps {
  /** Triggers the server-side export download. Should resolve once the file is saved. */
  onExport: () => Promise<void>;
  label?: string;
}

/** Export button backed by a server endpoint that streams the full dataset as an .xlsx file. */
export function ServerExportButton({ onExport, label = 'Export' }: ServerExportButtonProps) {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await onExport();
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      leftIcon={<Download size={16} strokeWidth={1.5} />}
      isLoading={isExporting}
      onClick={handleExport}
    >
      {label}
    </Button>
  );
}
