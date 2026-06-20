import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportCsv, type CsvColumn } from '@/utils/exportCsv';

interface ExportButtonProps<T> {
  data: T[];
  columns: CsvColumn<T>[];
  filename: string;
}

export function ExportButton<T>({ data, columns, filename }: ExportButtonProps<T>) {
  return (
    <Button
      variant="outline"
      leftIcon={<Download size={16} strokeWidth={1.5} />}
      onClick={() => exportCsv(data, columns, filename)}
      disabled={data.length === 0}
    >
      Export
    </Button>
  );
}
