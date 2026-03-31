import { useMemo, useState } from "react";
import { Download, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MediaPreviewDialogProps {
  url: string | null;
  onClose: () => void;
  alt?: string;
}

export function MediaPreviewDialog({ url, onClose, alt = "Preview" }: MediaPreviewDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const clampedZoom = useMemo(() => Math.min(3, Math.max(0.5, zoom)), [zoom]);

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const zoomIn = () => setZoom((z) => Math.min(3, z + 0.2));
  const zoomOut = () => setZoom((z) => Math.max(0.5, z - 0.2));

  return (
    <Dialog
      open={!!url}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetZoom();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl p-4">
        {url ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-12">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Document preview</div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={zoomOut} className="h-9 w-9 p-0">
                  <Minus size={16} />
                </Button>
                <div className="text-xs text-[var(--text-muted)]">{Math.round(clampedZoom * 100)}%</div>
                <Button type="button" variant="ghost" onClick={zoomIn} className="h-9 w-9 p-0">
                  <Plus size={16} />
                </Button>
                <Button type="button" variant="ghost" onClick={resetZoom} className="h-9 w-9 p-0">
                  <RotateCcw size={16} />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "document";
                    link.rel = "noreferrer";
                    link.click();
                  }}
                  className="gap-2"
                >
                  <Download size={16} />
                  Download
                </Button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-deep)]/60">
              {url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`${url}#toolbar=0&navpanes=0`}
                  className="w-full h-[70vh] border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="overflow-auto p-3 h-full">
                  <div
                    className={`origin-top-left ${clampedZoom > 1 ? "cursor-grab" : ""} ${isPanning ? "cursor-grabbing" : ""}`}
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${clampedZoom})` }}
                    onPointerDown={(e) => {
                      if (clampedZoom <= 1) return;
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      setIsPanning(true);
                      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                    }}
                    onPointerMove={(e) => {
                      if (!isPanning) return;
                      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
                    }}
                    onPointerUp={(e) => {
                      if (!isPanning) return;
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      setIsPanning(false);
                    }}
                    onPointerLeave={() => {
                      if (isPanning) setIsPanning(false);
                    }}
                  >
                    <img src={url} alt={alt} className="max-w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
