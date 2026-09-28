'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface BannerUploadProps {
  bannerUrl: string;
  onChange: (url: string) => void;
  title?: string;
  tagline?: string;
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  bannerUrl,
  onChange,
  title = '',
  tagline = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Instant local preview
      const localPreview = URL.createObjectURL(file);
      onChange(localPreview);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.data?.url) {
        onChange(data.data.url);
      } else {
        // Fallback to Base64 data URL if server route fails
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onChange(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Banner upload error:', err);
      // Fallback to local Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#334155]">
          Banner Image
        </label>
        <div className="flex items-center gap-2">
          {bannerUrl && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Banner</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL Input' : 'Paste Image URL'}</span>
          </button>
        </div>
      </div>

      {/* Main Banner Zone / Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!bannerUrl && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`w-full rounded-2xl border-2 transition-all overflow-hidden ${
          bannerUrl
            ? 'border-[#E2E8F0] bg-slate-900'
            : dragOver
            ? 'border-[#2563EB] bg-[#EFF6FF] cursor-pointer'
            : 'border-dashed border-[#BFDBFE] bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#F1F5F9] cursor-pointer hover:border-[#2563EB] hover:bg-[#EFF6FF]/50'
        } min-h-[160px] relative flex flex-col items-center justify-center p-4 text-center select-none`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {bannerUrl ? (
          <div className="w-full relative group">
            <div className="w-full h-44 sm:h-52 relative rounded-xl overflow-hidden bg-slate-950 shadow-inner">
              <img
                src={bannerUrl}
                alt="Hackathon Banner Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Hover overlay to change banner */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-white text-[#0F172A] text-xs font-bold rounded-lg shadow hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-[#2563EB]" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg shadow hover:bg-[#B91C1C] transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 flex flex-col items-center justify-center space-y-2.5">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
                <span className="text-xs font-bold text-[#2563EB]">Uploading banner image...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0F172A]">
                    <span className="text-[#2563EB] hover:underline">Click to upload banner</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    PNG, JPG, WEBP, or SVG up to 5MB (Recommended 1200 × 400px)
                  </p>
                </div>
                {title && (
                  <div className="mt-2 pt-2 border-t border-[#BFDBFE]/60 max-w-sm">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block mb-0.5">Preview Heading</span>
                    <h4 className="text-sm font-black text-[#1E40AF] truncate">{title}</h4>
                    {tagline && <p className="text-[11px] text-[#2563EB] truncate font-medium">{tagline}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-[#DC2626] font-medium flex items-center gap-1">
          <span>•</span>
          <span>{uploadError}</span>
        </p>
      )}

      {/* Optional URL Input */}
      {showUrlInput && (
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-semibold text-[#64748B]">Or enter Direct Image URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/... or /banners/banner.png"
              className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            {bannerUrl && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-2 text-xs text-[#DC2626] bg-[#FEF2F2] rounded-xl hover:bg-[#FEE2E2]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
