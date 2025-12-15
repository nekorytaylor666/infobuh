import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Skeleton } from "@/components/ui/skeleton";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
  className?: string;
  mode?: "compact" | "full";
  onLoad?: () => void;
  onError?: () => void;
}

export function PdfViewer({
  url,
  className = "",
  mode = "full",
  onLoad,
  onError,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());

  const renderPage = useCallback(
    async (
      pdf: pdfjsLib.PDFDocumentProxy,
      pageNum: number,
      container: HTMLDivElement
    ) => {
      try {
        const page = await pdf.getPage(pageNum);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) return;

        const containerWidth = container.clientWidth || 600;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.style.display = "block";
        canvas.style.marginBottom = mode === "full" ? "8px" : "0";

        // Cancel any existing render task for this page
        const existingTask = renderTasksRef.current.get(pageNum);
        if (existingTask) {
          existingTask.cancel();
        }

        const renderTask = page.render({
          canvasContext: context,
          viewport: scaledViewport,
        });

        renderTasksRef.current.set(pageNum, renderTask);

        await renderTask.promise;
        container.appendChild(canvas);
        renderTasksRef.current.delete(pageNum);
      } catch (error) {
        if ((error as Error).name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNum}:`, error);
        }
      }
    },
    [mode]
  );

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const container = containerRef.current;
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Clear previous content
        container.innerHTML = "";

        // Cancel any existing render tasks
        renderTasksRef.current.forEach((task) => task.cancel());
        renderTasksRef.current.clear();

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);

        // In compact mode, only render first page
        const pagesToRender = mode === "compact" ? 1 : pdf.numPages;

        for (let i = 1; i <= pagesToRender; i++) {
          if (cancelled) break;
          await renderPage(pdf, i, container);
        }

        if (!cancelled) {
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading PDF:", error);
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [url, mode, renderPage, onLoad, onError]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground ${className}`}
      >
        Failed to load PDF
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
      )}
      <div
        ref={containerRef}
        className={`${mode === "full" ? "overflow-auto" : "overflow-hidden"} ${isLoading ? "opacity-0" : "opacity-100"}`}
        style={{ transition: "opacity 0.2s ease-in-out" }}
      />
    </div>
  );
}
