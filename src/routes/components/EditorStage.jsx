import { useEffect, useState } from "react";
import {
    Stage,
    Layer,
    Image as KonvaImage,
    Line,
    Circle,
} from "react-konva";
import { renderPdf } from "../utils/pdfRenderer";

export default function EditorStage({
    pdf,
    containerWidth,
    rooms,
    setRooms,
    currentPolygon,
    setCurrentPolygon,
}) {

    const [pdfCanvas, setPdfCanvas] = useState(null);

    const [stageSize, setStageSize] = useState({
        width: containerWidth,
        height: 800,
    });

    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!pdf) return;

        async function loadPdf() {
            const canvas = await renderPdf(pdf, containerWidth);

            setStageSize({
                width: canvas.width,
                height: canvas.height,
            });

            setPdfCanvas(canvas);
        }

        loadPdf();
    }, [pdf, containerWidth]);

    // ============================
    // Add Point
    // ============================

    const handleStageClick = (e) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        // First click starts a new room
        if (!isDrawing) {
            setIsDrawing(true);
            setCurrentPolygon([
                {
                    id: crypto.randomUUID(),
                    x: pointer.x,
                    y: pointer.y,
                },
            ]);
            return;
        }

        // Continue current room
        setCurrentPolygon((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                x: pointer.x,
                y: pointer.y,
            },
        ]);
    };

    // ============================
    // Finish Room
    // ============================

    const finishPolygon = () => {

        if (currentPolygon.length < 3) {
            alert("Polygon needs at least 3 points.");
            return;
        }

        const roomName = prompt(
            "Enter Room Name",
            `Room ${rooms.length + 1}`
        );

        if (!roomName) return;

        const room = {
            id: crypto.randomUUID(),
            name: roomName,

            pdfWidth: stageSize.width,
            pdfHeight: stageSize.height,

            points: [...currentPolygon],
        };

        setRooms((prev) => [...prev, room]);

        console.log("Saved Room:", room);
        console.log("All Rooms:", [...rooms, room]);

        // Ready for next room
        setCurrentPolygon([]);
        setIsDrawing(false);
    };

    // ============================
    // Undo
    // ============================

    const undoPoint = () => {
        setCurrentPolygon(prev => prev.slice(0, -1));
    };

    // ============================
    // Keyboard Shortcuts
    // ============================

    useEffect(() => {

        const handleKeyDown = (e) => {

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                undoPoint();
            }

            if (e.key === "Backspace") {
                e.preventDefault();
                undoPoint();
            }

            if (e.key === "Enter") {
                e.preventDefault();
                finishPolygon();
            }

        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);

    }, [currentPolygon]);

    const currentLine = currentPolygon.flatMap(p => [p.x, p.y]);

    return (
        <>
            <div
                style={{
                    marginBottom: 10,
                    display: "flex",
                    gap: 10,
                }}
            >
                <button
                    onClick={finishPolygon}
                    disabled={!isDrawing}
                >
                    Finish Polygon
                </button>

                <button
                    onClick={() => {
                        setCurrentPolygon([]);
                        setIsDrawing(false);
                    }}
                >
                    Cancel
                </button>
            </div>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
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

                {/* Completed Rooms */}

                <Layer>

                    {rooms.map(room => (
                        <Line
                            key={room.id}
                            points={room.points.flatMap(p => [p.x, p.y])}
                            closed
                            fill="rgba(255,0,0,0.20)"
                            stroke="red"
                            strokeWidth={2}
                        />
                    ))}

                    {/* Current Drawing */}

                    {currentPolygon.length > 1 && (
                        <Line
                            points={currentLine}
                            stroke="red"
                            strokeWidth={2}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* Vertices */}

                    {currentPolygon.map(point => (
                        <Circle
                            key={point.id}
                            x={point.x}
                            y={point.y}
                            radius={5}
                            fill="red"
                        />
                    ))}

                </Layer>

            </Stage>
            <div
                style={{
                    marginTop: 20,
                    background: "#f5f5f5",
                    padding: 10,
                }}
            >
                <b>Saved Rooms</b>

                {rooms.map(room => (
                    <div key={room.id}>
                        {room.name} ({room.points.length} points)
                    </div>
                ))}
            </div>
        </>
    );
}