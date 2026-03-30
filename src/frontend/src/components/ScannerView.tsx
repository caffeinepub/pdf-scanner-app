import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Camera,
  Check,
  Download,
  FileText,
  Loader2,
  Plus,
  ScanText,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useCamera } from "../camera/useCamera";
import { useCreateDocument, useListFolders } from "../hooks/useDocuments";

type ImageFilter = "none" | "grayscale" | "bw" | "contrast";

const filterStyles: Record<ImageFilter, string> = {
  none: "",
  grayscale: "grayscale(100%)",
  bw: "grayscale(100%) contrast(150%) brightness(110%)",
  contrast: "contrast(160%) brightness(105%)",
};

interface CapturedPage {
  dataUrl: string;
  filter: ImageFilter;
}

export function ScannerView({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [currentFilter, setCurrentFilter] = useState<ImageFilter>("none");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [docName, setDocName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders = [] } = useListFolders();
  const createDoc = useCreateDocument();

  const {
    isActive,
    isLoading: camLoading,
    error: camError,
    isSupported,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "environment",
    quality: 0.9,
    format: "image/jpeg",
  });

  const handleCapture = useCallback(async () => {
    const file = await capturePhoto();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPages((prev) => [...prev, { dataUrl, filter: currentFilter }]);
    };
    reader.readAsDataURL(file);
  }, [capturePhoto, currentFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPages((prev) => [...prev, { dataUrl, filter: currentFilter }]);
    };
    reader.readAsDataURL(file);
  };

  const handleOCR = async () => {
    if (pages.length === 0) return;
    setOcrLoading(true);
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.default.recognize(
        pages[pages.length - 1].dataUrl,
        "eng",
      );
      setOcrText(result.data.text);
    } catch {
      setOcrText("OCR failed. Please try again.");
    } finally {
      setOcrLoading(false);
    }
  };

  const applyFilterToCanvas = (
    dataUrl: string,
    filter: ImageFilter,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.filter = filterStyles[filter] || "none";
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = dataUrl;
    });
  };

  const handleGenerateAndSave = async () => {
    if (pages.length === 0) return;
    const name = docName.trim() || `Scan ${new Date().toLocaleDateString()}`;
    const folder = folderName || "";

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const filteredUrl = await applyFilterToCanvas(
          pages[i].dataUrl,
          pages[i].filter,
        );
        pdf.addImage(filteredUrl, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      const pdfBytes = new Uint8Array(pdf.output("arraybuffer"));

      createDoc.mutate(
        {
          name,
          folderName: folder,
          bytes: pdfBytes,
          onProgress: setUploadProgress,
        },
        {
          onSuccess: () => {
            stopCamera();
            onClose();
          },
        },
      );
    } catch {
      // handled by mutation
    }
  };

  const lastPage = pages[pages.length - 1];

  return (
    <section className="max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground mb-6">Scan Document</h2>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          data-ocid="scanner.camera.tab"
          variant={mode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("camera")}
          className="gap-2"
        >
          <Camera className="w-4 h-4" /> Camera
        </Button>
        <Button
          data-ocid="scanner.upload.tab"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
          className="gap-2"
        >
          <Upload className="w-4 h-4" /> Upload File
        </Button>
      </div>

      {/* Camera section */}
      {mode === "camera" && (
        <div className="mb-6">
          {isSupported === false ? (
            <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
              Camera not supported in this browser
            </div>
          ) : (
            <>
              <div
                className="relative w-full rounded-xl overflow-hidden bg-black"
                style={{ aspectRatio: "16/9", minHeight: "200px" }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{ display: isActive ? "block" : "none" }}
                />
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white/30" />
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>

              {camError && (
                <p className="text-sm text-destructive mt-2">
                  {camError.message}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {!isActive ? (
                  <Button
                    data-ocid="scanner.camera.primary_button"
                    onClick={startCamera}
                    disabled={camLoading}
                    className="gap-2"
                  >
                    {camLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button
                      data-ocid="scanner.capture.primary_button"
                      onClick={handleCapture}
                      disabled={!isActive}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" /> Capture
                    </Button>
                    <Button
                      variant="outline"
                      data-ocid="scanner.camera.stop_button"
                      onClick={stopCamera}
                      className="gap-2"
                    >
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload section */}
      {mode === "upload" && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            data-ocid="scanner.dropzone"
            className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload an image</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WEBP supported
            </p>
          </button>
        </div>
      )}

      {/* Captured pages */}
      {pages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Pages ({pages.length})
            </h3>
            <Button
              data-ocid="scanner.add_page.button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() =>
                mode === "camera"
                  ? handleCapture()
                  : fileInputRef.current?.click()
              }
            >
              <Plus className="w-3.5 h-3.5" /> Add Page
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pages.map((page, i) => (
              <div
                key={page.dataUrl.slice(-20)}
                data-ocid={`scanner.page.item.${i + 1}`}
                className="relative shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={page.dataUrl}
                  alt={`Page ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: filterStyles[page.filter] }}
                />
                <div className="absolute bottom-1 right-1">
                  <Badge className="text-[9px] px-1 py-0">{i + 1}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Image Filter
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(["none", "grayscale", "bw", "contrast"] as ImageFilter[]).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    data-ocid={`scanner.filter.${f}.toggle`}
                    onClick={() => {
                      setCurrentFilter(f);
                      setPages((prev) =>
                        prev.map((p, pi) =>
                          pi === prev.length - 1 ? { ...p, filter: f } : p,
                        ),
                      );
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      currentFilter === f
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {f === "none"
                      ? "Original"
                      : f === "bw"
                        ? "B&W"
                        : f === "grayscale"
                          ? "Grayscale"
                          : "Contrast"}
                  </button>
                ),
              )}
            </div>
          </div>

          {lastPage && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border w-full max-w-xs">
              <img
                src={lastPage.dataUrl}
                alt="Preview"
                className="w-full object-contain"
                style={{
                  filter: filterStyles[lastPage.filter],
                  maxHeight: "200px",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* OCR Section */}
      {pages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Button
              data-ocid="scanner.ocr.button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleOCR}
              disabled={ocrLoading}
            >
              {ocrLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ScanText className="w-4 h-4" />
              )}
              Extract Text (OCR)
            </Button>
          </div>
          {ocrText && (
            <Textarea
              data-ocid="scanner.ocr.textarea"
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Extracted text will appear here..."
              rows={5}
              className="text-xs font-mono"
            />
          )}
        </div>
      )}

      {/* Save Section */}
      {pages.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Save Document
          </h3>
          <div className="space-y-1">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              data-ocid="scanner.docname.input"
              placeholder={`Scan ${new Date().toLocaleDateString()}`}
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Folder</Label>
            <Select value={folderName} onValueChange={setFolderName}>
              <SelectTrigger data-ocid="scanner.folder.select">
                <SelectValue placeholder="No folder (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder (root)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {createDoc.isPending && (
            <div data-ocid="scanner.upload.loading_state">
              <p className="text-xs text-muted-foreground mb-1">
                Uploading... {Math.round(uploadProgress)}%
              </p>
              <Progress value={uploadProgress} />
            </div>
          )}

          {createDoc.isSuccess && (
            <div
              data-ocid="scanner.upload.success_state"
              className="flex items-center gap-2 text-emerald-600 text-sm"
            >
              <Check className="w-4 h-4" /> Document saved successfully!
            </div>
          )}

          <div className="flex gap-2">
            <Button
              data-ocid="scanner.generate.primary_button"
              onClick={handleGenerateAndSave}
              disabled={createDoc.isPending || pages.length === 0}
              className="gap-2 flex-1"
            >
              {createDoc.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate & Save PDF
            </Button>
            <Button
              variant="outline"
              data-ocid="scanner.download.secondary_button"
              disabled={createDoc.isPending || pages.length === 0}
              className="gap-2"
              onClick={async () => {
                if (pages.length === 0) return;
                const { jsPDF } = await import("jspdf");
                const pdf = new jsPDF({
                  orientation: "portrait",
                  unit: "mm",
                  format: "a4",
                });
                for (let i = 0; i < pages.length; i++) {
                  if (i > 0) pdf.addPage();
                  const filtered = await applyFilterToCanvas(
                    pages[i].dataUrl,
                    pages[i].filter,
                  );
                  pdf.addImage(
                    filtered,
                    "JPEG",
                    0,
                    0,
                    210,
                    297,
                    undefined,
                    "FAST",
                  );
                }
                pdf.save(`${docName || "scan"}.pdf`);
              }}
            >
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
