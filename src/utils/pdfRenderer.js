import { pdfjs } from "react-pdf";

export async function renderPdf(pdf, width) {

    let loadingTask;

    // Uploaded File
    if (pdf instanceof File) {

        const buffer = await pdf.arrayBuffer();

        loadingTask = pdfjs.getDocument({
            data: buffer,
        });

    }
    // Imported PDF
    else {

        loadingTask = pdfjs.getDocument(pdf);

    }

    const pdfDoc = await loadingTask.promise;

    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 1 });

    const scale = width / viewport.width;

    const scaledViewport = page.getViewport({
        scale,
    });

    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
        canvasContext: context,
        viewport: scaledViewport,
    }).promise;

    return canvas;
}