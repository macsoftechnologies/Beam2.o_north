import { useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import useImage from "use-image";
import { renderPdf } from "../utils/pdfRenderer"; // same util you already use

export default function ZonePolygonViewer({
    pdf,
    zones = [],
    width = 900,
    selectedZoneId,
    onZoneClick,
}) {
    const [imageUrl, setImageUrl] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [stageSize, setStageSize] = useState({ width, height: 600 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const [image] = useImage(imageUrl);

    // Render PDF page to an off-screen canvas → data URL (reuses your existing util)
    useEffect(() => {
        let mounted = true;

        async function load() {
            const canvas = await renderPdf(pdf, width);
            if (!mounted) return;

            setStageSize({ width: canvas.width, height: canvas.height });
            setCanvasSize({ width: canvas.width, height: canvas.height });
            setImageUrl(canvas.toDataURL());
        }

        load();
        return () => { mounted = false; };
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
                        background: "#151d30",
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
                height={stageSize.height || 600}
                style={{ visibility: image ? "visible" : "hidden" }}
            >

                {/* Layer 1 – PDF background image (non-interactive) */}
                <Layer listening={false}>
                    {image && (
                        <KonvaImage
                            image={image}
                            width={stageSize.width}
                            height={stageSize.height}
                        />
                    )}
                </Layer>

                {/* Layer 2 – Zone polygons */}
                <Layer>
                    {zones.map((zone, index) => {
                        const isSelected = selectedZoneId === zone.id;
                        const isHovered = hoveredZoneId === zone.id;

                        // Scale polygon coords from PDF space → canvas space
                        const scaleX = canvasSize.width / zone.pdfWidth;
                        const scaleY = canvasSize.height / zone.pdfHeight;

                        const scaledPoints = zone.points.flatMap((p) => [
                            p.x * scaleX,
                            p.y * scaleY,
                        ]);

                        return (
                            <Line
                                key={zone.id || index}
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
                        );
                    })}
                </Layer>

            </Stage>
        </div>
    );
}