import { useEffect, useState } from "react";
import {
    Stage,
    Layer,
    Image as KonvaImage,
    Line,
} from "react-konva";
import useImage from "use-image";
import { renderPdf } from "../utils/pdfRenderer";

export default function PdfPolygonViewer({
    pdf,
    rooms,
    width,
    selectedRooms,
    toggleRoom,
}) {

    const [imageUrl, setImageUrl] = useState(null);
    const [hoveredRoom, setHoveredRoom] = useState(null);

    const [stageSize, setStageSize] = useState({
        width,
        height: 800,
    });

    const [canvasSize, setCanvasSize] = useState({
        width: 0,
        height: 0,
    });

    const [image] = useImage(imageUrl);

    useEffect(() => {

        let mounted = true;

        async function load() {

            const canvas = await renderPdf(pdf, width);
            console.log(canvas.width);
            console.log(canvas.height);
            if (!mounted) return;

            setStageSize({
                width: canvas.width,
                height: canvas.height
            });
            setCanvasSize({
                width: canvas.width,
                height: canvas.height,
            });

            setImageUrl(canvas.toDataURL());

        }

        load();
        console.log("Rooms:", rooms);
        console.log("First room:", rooms[0]);

        return () => mounted = false;

    }, [pdf, width]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
                position: "relative",
                minHeight: "400px",
            }}
        >
            <style>{`
                .pdf-loader-spinner {
                    width: 44px;
                    height: 44px;
                    border: 3.5px solid rgba(59, 130, 246, 0.1);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: pdf-spin 0.8s linear infinite;
                }
                @keyframes pdf-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {!image && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "14px",
                        background: "#1b2436",
                        zIndex: 10,
                        borderRadius: "8px",
                    }}
                >
                    <div className="pdf-loader-spinner" />
                    <span style={{ color: "#9ca3af", fontSize: "13.5px", fontWeight: 500, letterSpacing: "0.3px" }}>
                        Loading Floor Plan...
                    </span>
                </div>
            )}

            <Stage
                width={stageSize.width || width}
                height={stageSize.height || 800}
                style={{ visibility: image ? "visible" : "hidden" }}
            >

                {/* PDF */}

                <Layer listening={false}>

                    {image && (

                        <KonvaImage
                            image={image}
                            width={stageSize.width}
                            height={stageSize.height}
                        />

                    )}

                </Layer>

                {/* Polygons */}

                <Layer>
                    {rooms.map((room) => {

                        const selected = selectedRooms.includes(room.name);
                        const scaleX = canvasSize.width / room.pdfWidth;
                        const scaleY = canvasSize.height / room.pdfHeight;

                        const scaledPoints = room.points.flatMap((p) => [
                            p.x * scaleX,
                            p.y * scaleY,
                        ]);

                        return (
                            <Line
                                key={room.id}
                                points={scaledPoints}
                                closed
                                fill={
                                    selected
                                        ? "rgba(34,197,94,0.35)"
                                        : hoveredRoom === room.name
                                            ? "rgba(255,255,0,0.25)"
                                            : "rgba(255,0,0,0.10)"
                                }
                                stroke={
                                    selected
                                        ? "#22c55e"
                                        : "#ef4444"
                                }
                                strokeWidth={2}
                                onClick={() => toggleRoom(room.name)}
                                onTap={() => toggleRoom(room.name)}
                                onMouseEnter={() => {
                                    document.body.style.cursor = "pointer";
                                    setHoveredRoom(room.name);
                                }}
                                onMouseLeave={() => {
                                    document.body.style.cursor = "default";
                                    setHoveredRoom(null);
                                }}
                                hitStrokeWidth={15}
                            />
                        );
                    })}
                </Layer>

            </Stage>
        </div>
    );

}