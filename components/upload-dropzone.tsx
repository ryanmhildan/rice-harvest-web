/**
 * components/upload-dropzone.tsx
 * ================================================================
 * Komponen drag-drop multi-file upload untuk foto drone.
 *
 * KONSEP REACT YANG DIPAKAI:
 *   - useState untuk simpan list file yang dipilih
 *   - useRef untuk akses langsung ke <input type="file"> agar bisa
 *     trigger klik programatik (UX umum: klik area = open file picker)
 *   - Drag-drop API native browser (onDragOver, onDrop, dll)
 *
 * KENAPA TIDAK PAKAI react-dropzone?
 * Library tambahan = dep+ + harus dijelaskan saat sidang.
 * Native drag-drop browser sudah cukup untuk skripsi.
 * ================================================================
 */
"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  /** Callback saat user pilih atau drop file. */
  onFilesSelected: (files: File[]) => void;
  /** File yang sudah dipilih (controlled). */
  files: File[];
  /** Disable saat upload sedang berjalan. */
  disabled?: boolean;
  /** Min file untuk validasi UI (default 4). */
  minFiles?: number;
}

export function UploadDropzone({
  onFilesSelected,
  files,
  disabled = false,
  minFiles = 4,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handler: user pilih file via dialog
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length > 0) {
      onFilesSelected([...files, ...newFiles]);
    }
    // Reset input agar bisa pilih file yang sama lagi
    if (inputRef.current) inputRef.current.value = "";
  }

  // Handler: drag-drop
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      // Hanya terima JPG
      /\.(jpe?g)$/i.test(f.name)
    );
    if (droppedFiles.length > 0) {
      onFilesSelected([...files, ...droppedFiles]);
    }
  }

  // Handler: hapus file individual
  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  }

  function clearAll() {
    onFilesSelected([]);
  }

  // Total ukuran file
  const totalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);

  return (
    <div className="space-y-4">
      {/* Dropzone area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors",
          isDragging
            ? "border-green-500 bg-green-50"
            : "border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-4 text-sm font-medium text-slate-700">
          {isDragging
            ? "Lepaskan untuk upload"
            : "Klik untuk pilih atau drag-drop foto drone di sini"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Format: JPG/JPEG • Minimum {minFiles} foto • Sebaiknya dengan EXIF GPS
        </p>
      </div>

      {/* List file terpilih */}
      {files.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <p className="text-sm font-medium text-slate-700">
              {files.length} foto dipilih ({totalSizeMB.toFixed(1)} MB)
              {files.length < minFiles && (
                <span className="ml-2 text-xs text-amber-600">
                  • Butuh minimal {minFiles} foto
                </span>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              Bersihkan semua
            </Button>
          </div>

          {/* Grid thumbnail */}
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {files.map((file, i) => (
              <FileChip
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => removeFile(i)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Chip kecil untuk tampilkan 1 file dengan tombol hapus. */
function FileChip({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled: boolean;
}) {
  // Truncate nama file kalau terlalu panjang
  const displayName =
    file.name.length > 20 ? file.name.slice(0, 17) + "..." : file.name;
  const sizeKB = (file.size / 1024).toFixed(0);

  return (
    <div className="group relative flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
      <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate font-medium text-slate-700" title={file.name}>
          {displayName}
        </p>
        <p className="text-[10px] text-slate-500">{sizeKB} KB</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
        aria-label="Hapus file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
