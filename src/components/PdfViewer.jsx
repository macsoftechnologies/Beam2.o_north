import { Document, Page, pdfjs } from "react-pdf";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();
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