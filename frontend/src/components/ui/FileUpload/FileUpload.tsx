import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileUploadProps {
  accept: string;
  maxSizeMb?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  preview?: 'image' | 'none';
  label?: string;
  hint?: string;
}

export function FileUpload({
  accept,
  maxSizeMb = 5,
  multiple = false,
  onFilesSelected,
  preview = 'none',
  label = 'Drop files here or click to browse',
  hint,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const tooBig = files.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig) {
      setError(`Each file must be under ${maxSizeMb}MB`);
      return;
    }
    setError(null);
    if (preview === 'image' && files[0]?.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(files[0]));
    }
    onFilesSelected(files);
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
          dragging ? 'border-accent-600 bg-accent-100' : 'border-strong hover:bg-sunken',
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken">
            <UploadCloud size={22} strokeWidth={1.5} className="text-ink-400" />
          </span>
        )}
        <div>
          <p className="text-body-sm font-medium text-ink-900">{label}</p>
          <p className="mt-0.5 text-caption text-ink-400">
            {hint ?? `${accept} · up to ${maxSizeMb}MB`}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 text-caption text-danger-600">{error}</p>}
    </div>
  );
}
