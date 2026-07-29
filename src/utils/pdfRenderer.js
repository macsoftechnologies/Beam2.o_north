import { pdfjs } from "react-pdf";

// Cache for loaded PDF documents to avoid re-fetching and re-parsing.
const docCache = new Map();
const fileDocCache = new WeakMap();

async function getPdfDocument(pdf) {
    if (pdf instanceof File) {
        if (fileDocCache.has(pdf)) {
            return fileDocCache.get(pdf);
        }

        const objectUrl = URL.createObjectURL(pdf);
        const loadingTask = pdfjs.getDocument(objectUrl);
        const promise = loadingTask.promise.then((doc) => {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch (e) {
                console.error("Error revoking object URL:", e);
            }
            return doc;
        }).catch((err) => {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch (e) {}
            throw err;
        });

        fileDocCache.set(pdf, promise);
        return promise;
    } else {
        if (docCache.has(pdf)) {
            return docCache.get(pdf);
        }

        const loadingTask = pdfjs.getDocument(pdf);
        const promise = loadingTask.promise;
        docCache.set(pdf, promise);
        return promise;
    }
}

export async function renderPdf(pdf, width, height) {
    const pdfDoc = await getPdfDocument(pdf);
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });

    let scale = width / viewport.width;
    if (height && (viewport.height * scale > height)) {
        scale = height / viewport.height;
    }

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