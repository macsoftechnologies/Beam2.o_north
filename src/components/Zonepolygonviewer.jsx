import { useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text } from "react-konva";
import { renderPdf } from "../utils/pdfRenderer"; // same util you already use

export default function ZonePolygonViewer({
    pdf,
    zones = [],
    width = 900,
    selectedZoneId,
    onZoneClick,
}) {
    const [pdfCanvas, setPdfCanvas] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [stageSize, setStageSize] = useState({ width, height: 600 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Render PDF page to an off-screen canvas (reuses your existing util)
    useEffect(() => {
        let mounted = true;

        async function load() {
            const canvas = await renderPdf(pdf, width);
            if (!mounted) return;

            setStageSize({ width: canvas.width, height: canvas.height });
            setCanvasSize({ width: canvas.width, height: canvas.height });
            setPdfCanvas(canvas);
        }

        load();
        return () => { mounted = false; };
    }, [pdf, width]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", width: "100%" }}>
            <Stage width={stageSize.width} height={stageSize.height}>

                {/* Layer 1 – PDF background image (non-interactive) */}
                <Layer listening={false}>
                    {pdfCanvas && (
                        <KonvaImage
                            image={pdfCanvas}
                            width={stageSize.width}
                            height={stageSize.height}
                        />
                    )}
                </Layer>

                {/* Layer 2 – Zone polygons */}
                <Layer>
                    {zones.map((zone) => {
                        const isSelected = selectedZoneId === zone.id;
                        const isHovered = hoveredZoneId === zone.id;

                        // Scale polygon coords from PDF space → canvas space
                        const scaleX = canvasSize.width / zone.pdfWidth;
                        const scaleY = canvasSize.height / zone.pdfHeight;

                        const scaledPoints = zone.points.flatMap((p) => [
                            p.x * scaleX,
                            p.y * scaleY,
                        ]);

                        // Centroid for the label
                        const cx =
                            (zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length) * scaleX;
                        const cy =
                            (zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length) * scaleY;

                        return (
                            <>
                                <Line
                                    key={zone.id}
                                    points={scaledPoints}
                                    closed
                                    fill={
                                        isSelected
                                            ? "rgba(34, 197, 94, 0.35)"   // green  – selected
                                            : isHovered
                                                ? "rgba(255, 255,   0, 0.25)" // yellow – hover
                                                : "rgba(37,  99, 235, 0.15)"  // blue   – default
                                    }
                                    stroke={
                                        isSelected ? "#22c55e" : isHovered ? "#facc15" : "#3b82f6"
                                    }
                                    strokeWidth={isHovered || isSelected ? 3 : 2}
                                    onClick={() => onZoneClick && onZoneClick(zone)}
                                    onTap={() => onZoneClick && onZoneClick(zone)}
                                    onMouseEnter={() => {
                                        document.body.style.cursor = "pointer";
                                        setHoveredZoneId(zone.id);
                                    }}
                                    onMouseLeave={() => {
                                        document.body.style.cursor = "default";
                                        setHoveredZoneId(null);
                                    }}
                                    hitStrokeWidth={15}
                                />
                                {/* Zone name label rendered at polygon centroid */}
                                <Text
                                    key={`${zone.id}-label`}
                                    x={cx - 30}
                                    y={cy - 10}
                                    text={`Zone ${zone.name}`}
                                    fontSize={13}
                                    fontStyle="bold"
                                    fill="#ffffff"
                                    shadowColor="black"
                                    shadowBlur={4}
                                    listening={false}
                                />
                            </>
                        );
                    })}
                </Layer>

            </Stage>
        </div>
    );
}