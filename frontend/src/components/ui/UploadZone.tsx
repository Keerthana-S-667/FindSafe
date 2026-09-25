import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, FileVideo, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface UploadZoneProps {
  label?: string;
  helperText?: string;
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  value?: File | null;
  sampleButtonLabel?: string;
  onSampleSelect?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  label = 'Upload Reference Photograph',
  helperText = 'Supported formats: JPG, JPEG, PNG, WEBP (Max 10MB)',
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/avi,video/x-matroska,.mp4,.mov,.avi,.mkv,.webm',
  maxSizeMB = 10,
  value,
  sampleButtonLabel,
  onSampleSelect,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(value || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedFile(value);
      if (value) {
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [value]);

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (onFileSelect) onFileSelect(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  const isVideo = selectedFile?.type.startsWith('video/') || Boolean(selectedFile?.name.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/i));

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-surface-950 mb-1.5 tracking-tight">{label}</label>}

      {previewUrl || selectedFile ? (
        <div className="relative border border-surface-400 bg-surface-50 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          {isVideo ? (
            <div className="w-20 h-20 bg-surface-200 rounded-lg border border-surface-300 shrink-0 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-cover" />
              ) : (
                <FileVideo className="w-8 h-8 text-brand-600" />
              )}
            </div>
          ) : (
            <img src={previewUrl || ''} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-surface-300 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-extrabold text-surface-950 truncate">{selectedFile?.name || 'Uploaded File'}</h5>
            <p className="text-[11px] text-surface-700 font-mono font-medium mt-0.5">
              {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0.00'} MB
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="outline" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => fileInputRef.current?.click()}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" className="text-red-700 hover:text-red-900 font-bold" icon={<X className="w-3.5 h-3.5" />} onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-brand-600 bg-brand-500/15' : 'border-surface-400 bg-surface-200 hover:border-brand-500 hover:bg-surface-100'
            }`}
          >
            <div className="p-3 bg-surface-50 rounded-full text-surface-700 w-fit mx-auto mb-2 border border-surface-300 shadow-xs">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <h4 className="text-xs font-extrabold text-surface-950">Drag and drop CCTV video file or click to browse</h4>
            <p className="text-[11px] text-surface-700 font-medium mt-1">{helperText}</p>
          </div>

          {onSampleSelect && (
            <div className="text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSampleSelect();
                }}
                className="px-3 py-1.5 bg-surface-50 border border-surface-300 hover:bg-surface-100 rounded-lg text-[11px] font-bold text-brand-700 inline-flex items-center gap-1.5 transition-all shadow-xs"
              >
                <FileVideo className="w-3.5 h-3.5 text-brand-600" /> {sampleButtonLabel || 'Attach Sample Demo Video'}
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-1.5 text-xs text-red-700 font-bold">{error}</p>}
    </div>
  );
};
