import { useEffect, useState } from "react";
import {
    Stage,
    Layer,
    Image as KonvaImage,
    Line,
} from "react-konva";
import { renderPdf } from "../utils/pdfRenderer";

export default function PdfPolygonViewer({
    pdf,
    rooms,
    width,
    selectedRooms,
    toggleRoom,
}) {

    const [pdfCanvas, setPdfCanvas] = useState(null);
    const [hoveredRoom, setHoveredRoom] = useState(null);

    const [stageSize, setStageSize] = useState({
        width,
        height: 800,
    });

    const [canvasSize, setCanvasSize] = useState({
        width: 0,
        height: 0,
    });

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

            setPdfCanvas(canvas);

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
            }}
        >
            <Stage
                width={stageSize.width}
                height={stageSize.height}
            >

                {/* PDF */}

                <Layer listening={false}>

                    {pdfCanvas && (

                        <KonvaImage
                            image={pdfCanvas}
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