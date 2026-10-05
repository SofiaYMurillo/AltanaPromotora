"use client";

import { useCallback, useId, useRef, useState } from "react";

type MediaDropzoneProps = {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
};

type DropState = "idle" | "drag-over";

export function MediaDropzone({ onFilesSelected, disabled }: MediaDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<DropState>("idle");

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return;
      onFilesSelected(Array.from(fileList));
    },
    [disabled, onFilesSelected],
  );

  return (
    <div
      className={`admin-panel flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        state === "drag-over"
          ? "border-accent bg-accent/10"
          : "border-border/80 bg-surface/60"
      } ${disabled ? "opacity-60" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setState("drag-over");
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setState("drag-over");
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setState("idle");
      }}
      onDrop={(event) => {
        event.preventDefault();
        setState("idle");
        handleFiles(event.dataTransfer.files);
      }}
    >
      <p className="text-body-md text-foreground">
        Arrastra tus archivos aquí
      </p>
      <p className="text-body-sm text-muted">o</p>
      <label htmlFor={inputId} className="btn-primary cursor-pointer">
        Seleccionar archivos
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="text-caption text-muted">
        JPG · PNG · WEBP · AVIF · MP4 · WEBM
      </p>
    </div>
  );
}
