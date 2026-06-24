import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploadSectionProps {
  currentLogoUrl?: string;
  onLogoChange: (file: File | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const LogoUploadSection: React.FC<LogoUploadSectionProps> = ({ currentLogoUrl, onLogoChange }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onLogoChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeLogo = () => {
    setPreviewUrl(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-background border border-border/40 rounded-2xl p-6 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-2xl bg-accent/10 border-2 border-dashed border-border/40 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/50">
            {previewUrl ? (
              <img src={previewUrl} alt="Agency Logo" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-10 h-10 text-slate-500" />
            )}
          </div>
          {previewUrl && (
            <button
              onClick={removeLogo}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 w-full">
          <h3 className="text-lg font-semibold text-primary-foreground mb-1">Agency Logo</h3>
          <p className="text-sm text-slate-400 mb-4">
            Upload your agency logo. Recommended size 400x400px. Max 2MB.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border/60 bg-accent/10'}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleChange}
            />
            <Upload className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-sm font-medium text-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG or WebP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoUploadSection;
