"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";

export type CropAspect = "square" | "banner";

interface Props {
  src: string;
  aspect: CropAspect;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
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
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function ImageCropModal({ src, aspect, onDone, onCancel }: Props) {
  const aspectRatio = aspect === "square" ? 1 : 3.5;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[rgb(16,16,22)] border border-[rgb(40,40,55)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(40,40,55)]">
          <div>
            <h3 className="text-white font-semibold text-sm">
              {aspect === "square" ? "Crop Logo" : "Crop Banner"}
            </h3>
            <p className="text-xs text-[rgb(100,100,120)] mt-0.5">
              Pinch / scroll to zoom · drag to reposition
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,40)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper canvas */}
        <div
          className="relative bg-[rgb(8,8,12)]"
          style={{ height: aspect === "square" ? 320 : 220 }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid rgba(139,92,246,0.8)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-4 border-t border-[rgb(40,40,55)] space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))}
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
              onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-[rgb(30,30,40)] flex items-center justify-center text-[rgb(130,130,150)] hover:text-white transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-[rgb(100,100,120)] w-10 text-right font-mono">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {/* Actions */}
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
