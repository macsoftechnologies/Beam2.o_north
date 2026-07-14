import { Document, Page, pdfjs } from "react-pdf";


// Using a direct CDN URL avoids Nginx MIME-type issues with .mjs workers
// when the app is deployed under a sub-path (e.g. /m3north_frontend/).
// The version must match the installed pdfjs-dist package.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
export default function PdfViewer({
    pdf,
    onLoadSuccess,
    scale
}) {

    return (

        <Document
            file={pdf}
            onLoadSuccess={onLoadSuccess}
        >

            <Page
                pageNumber={1}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
            />

        </Document>

    );

}