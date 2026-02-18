"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";

export type CropAspect = "square" | "banner";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MediaSize {
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

interface Props {
  src: string;
  aspect: CropAspect;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

// ── Live preview computed from croppedAreaPixels + natural image size ──
function CropPreview({
  src,
  aspect,
  croppedAreaPixels,
  mediaSize,
}: {
  src: string;
  aspect: CropAspect;
  croppedAreaPixels: CropArea | null;
  mediaSize: MediaSize | null;
}) {
  // Preview container dimensions
  const previewW = aspect === "square" ? 72 : 220;
  const previewH = aspect === "square" ? 72 : Math.round(220 / 3.5);

  if (!croppedAreaPixels || !mediaSize || mediaSize.naturalWidth === 0) {
    return (
      <div
        className={`bg-[rgb(20,20,28)] border border-[rgb(40,40,55)] flex items-center justify-center text-[rgb(80,80,100)] text-xs ${aspect === "square" ? "rounded-2xl" : "rounded-xl"}`}
        style={{ width: previewW, height: previewH }}
      >
        …
      </div>
    );
  }

  const scale = previewW / croppedAreaPixels.width;
  const imgW = mediaSize.naturalWidth * scale;
  const imgH = mediaSize.naturalHeight * scale;
  const imgLeft = -croppedAreaPixels.x * scale;
  const imgTop = -croppedAreaPixels.y * scale;

  return (
    <div
      className={`relative overflow-hidden border-2 border-purple-500/60 shadow-lg ${aspect === "square" ? "rounded-2xl" : "rounded-xl"}`}
      style={{ width: previewW, height: previewH, flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          width: imgW,
          height: imgH,
          left: imgLeft,
          top: imgTop,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function ImageCropModal({ src, aspect, onDone, onCancel }: Props) {
  const aspectRatio = aspect === "square" ? 1 : 3.5;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const result = await getCroppedImg(src, croppedAreaPixels);
      onDone(result);
    } finally {
      setProcessing(false);
    }
  };

  const cropperHeight = aspect === "square" ? 300 : 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[rgb(16,16,22)] border border-[rgb(40,40,55)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgb(40,40,55)]">
          <div>
            <h3 className="text-white font-semibold text-sm">
              {aspect === "square" ? "Crop Logo" : "Crop Banner"}
            </h3>
            <p className="text-xs text-[rgb(100,100,120)] mt-0.5">
              Scroll / pinch to zoom · drag to reposition
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,40)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Cropper ── */}
        <div
          className="relative bg-[rgb(8,8,12)]"
          style={{ height: cropperHeight }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={(ms) => setMediaSize(ms as MediaSize)}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid rgba(139,92,246,0.9)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              },
            }}
          />
        </div>

        {/* ── Controls + Live Preview ── */}
        <div className="px-5 py-4 border-t border-[rgb(40,40,55)] space-y-4">

          {/* Zoom row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center text-[rgb(130,130,150)] hover:text-white transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={1}
              max={5}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple-500 h-1.5 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center text-[rgb(130,130,150)] hover:text-white transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-[rgb(100,100,120)] w-10 text-right font-mono">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {/* Live preview row */}
          <div className="flex items-start gap-4 p-3 rounded-xl bg-[rgb(10,10,16)] border border-[rgb(35,35,50)]">
            <CropPreview
              src={src}
              aspect={aspect}
              croppedAreaPixels={croppedAreaPixels}
              mediaSize={mediaSize}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[rgb(180,180,200)] mb-0.5">
                Live Preview
              </p>
              <p className="text-xs text-[rgb(100,100,120)]">
                {aspect === "square"
                  ? "This is exactly how your logo will appear on the community page."
                  : "This is how your banner will be cropped and displayed at the top of your page."}
              </p>
              {croppedAreaPixels && (
                <p className="text-xs text-[rgb(80,80,100)] font-mono mt-1.5">
                  {Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)}px
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="gradient"
              className="flex-1 gap-2"
              onClick={handleApply}
              disabled={processing}
            >
              {processing ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Apply Crop
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-[rgb(130,130,150)]"
              onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
