"use client";

import { useRef, useState, type DragEvent } from "react";

export function PhotoUpload({
  onFileSelect,
  accept = "image/*",
  maxSizeMb = 5,
  label = "Drop photo here or click to select",
}: {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): boolean {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb} MB.`);
      return false;
    }
    return true;
  }

  function handleFile(file: File) {
    if (!validate(file)) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`upload-zone${dragOver ? " upload-zone-active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="upload-preview"
        />
      ) : (
        <span className="upload-label">{label}</span>
      )}
      {error && <span className="upload-error">{error}</span>}
    </div>
  );
}
