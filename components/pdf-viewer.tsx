"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
    fileUrl: string;
    highlightPage?: number;
    onPageChange?: (page: number) => void;
}

export function PDFViewer({ fileUrl, highlightPage, onPageChange }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(highlightPage || 1);
    const [scale, setScale] = useState<number>(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    function changePage(offset: number) {
        const newPage = pageNumber + offset;
        if (newPage >= 1 && newPage <= numPages) {
            setPageNumber(newPage);
            onPageChange?.(newPage);
        }
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    function zoomIn() {
        setScale((prev) => Math.min(prev + 0.2, 2.0));
    }

    function zoomOut() {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    }

    // Jump to highlighted page when prop changes
    if (highlightPage && highlightPage !== pageNumber) {
        setPageNumber(highlightPage);
    }

    return (
        <div className="flex flex-col h-full bg-muted/30 rounded-lg border">
            {/* Controls */}
            <div className="flex items-center justify-between p-3 border-b bg-background/50">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={previousPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[100px] text-center">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 2.0}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Display */}
            <div className="flex-1 overflow-auto p-4">
                <div className="flex justify-center">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-64">
                                <div className="text-muted-foreground">Loading PDF...</div>
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center h-64">
                                <div className="text-destructive">Failed to load PDF</div>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            loading={
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-muted-foreground">Loading page...</div>
                                </div>
                            }
                            className={highlightPage === pageNumber ? "ring-2 ring-primary" : ""}
                        />
                    </Document>
                </div>
            </div>
        </div>
    );
}
