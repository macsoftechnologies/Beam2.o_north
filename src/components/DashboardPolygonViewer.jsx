import { useEffect, useState, useMemo, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Group, Rect } from "react-konva";
import useImage from "use-image";
import { renderPdf } from "../utils/pdfRenderer";

export default function DashboardPolygonViewer({
  pdf,
  rooms = [],
  width = 800,
  isZonesActive = true,
  roomsToReview = [],
  roomHoverData = {},
  onHoverRoom,
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [hoveredRoomName, setHoveredRoomName] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  // Track whether we've locked a room (the hover card is open)
  const lockedRoomRef = useRef(null);

  const [image] = useImage(imageUrl);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!pdf) return;
      try {
        const canvas = await renderPdf(pdf, Math.max(width * 2, 1600));
        if (!mounted) return;

        setCanvasSize({ width: canvas.width, height: canvas.height });
        setImageUrl(canvas.toDataURL());
      } catch (err) {
        console.error("Error loading PDF in DashboardPolygonViewer:", err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [pdf, width]);

  const scale = useMemo(() => {
    if (!canvasSize.width) return 1;
    return width / canvasSize.width;
  }, [canvasSize.width, width]);

  const stageWidth = canvasSize.width ? width : width;
  const stageHeight = canvasSize.height ? Math.round(canvasSize.height * scale) : 600;

  const getRoomColors = (roomName) => {
    if (roomHoverData && roomHoverData[roomName]) {
      const hData = roomHoverData[roomName];
      if (hData.clash && hData.clash.includes("Clash")) {
        return { fill: "rgba(239, 68, 68, 0.35)", stroke: "#ef4444" };
      }
      if (hData.permits && hData.permits !== "0 permits") {
        return { fill: "rgba(16, 185, 129, 0.35)", stroke: "#10b981" };
      }
    }

    const match = roomsToReview.find(
      (item) =>
        item.zone.toLowerCase().trim() === roomName.toLowerCase().trim() ||
        roomName.toLowerCase().trim().includes(item.zone.toLowerCase().trim()) ||
        item.zone.toLowerCase().trim().includes(roomName.toLowerCase().trim())
    );

    if (match) {
      if (match.clash) {
        return { fill: "rgba(239, 68, 68, 0.35)", stroke: "#ef4444" };
      }
      if (match.preOk > 0 || match.permits > 0) {
        return { fill: "rgba(16, 185, 129, 0.35)", stroke: "#10b981" };
      }
    }

    return { fill: "rgba(148, 163, 184, 0.15)", stroke: "#94a3b8" };
  };

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-start", width: "100%", overflow: "hidden" }}>
      {imageUrl ? (
        <Stage width={stageWidth} height={stageHeight} scaleX={scale} scaleY={scale}>
          {/* Layer 1: PDF Background */}
          <Layer listening={false}>
            {image && (
              <KonvaImage
                image={image}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            )}
          </Layer>

          {/* Layer 2: Room Polygons */}
          <Layer>
            {isZonesActive &&
              rooms.map((room) => {
                if (!room.points || room.points.length === 0) return null;

                const isHovered = hoveredRoomName === room.name;
                const colors = getRoomColors(room.name);

                const scaleX = canvasSize.width / (room.pdfWidth || 1);
                const scaleY = canvasSize.height / (room.pdfHeight || 1);

                const scaledPoints = room.points.flatMap((p) => [
                  p.x * scaleX,
                  p.y * scaleY,
                ]);

                const xs = room.points.map((p) => p.x * scaleX);
                const ys = room.points.map((p) => p.y * scaleY);
                const cx = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
                const cy = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;

                return (
                  <Group key={room.id || room.name}>
                    <Line
                      points={scaledPoints}
                      closed
                      fill={isHovered ? "rgba(250, 204, 21, 0.45)" : colors.fill}
                      stroke={isHovered ? "#facc15" : colors.stroke}
                      strokeWidth={isHovered ? 3 : 2}
                      onMouseEnter={() => {
                        document.body.style.cursor = "pointer";
                        setHoveredRoomName(room.name);
                        lockedRoomRef.current = room.name;
                        if (onHoverRoom) {
                          onHoverRoom({
                            name: room.name,
                            x: cx * scale,
                            y: cy * scale,
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        document.body.style.cursor = "default";
                        setHoveredRoomName(null);
                        // Don't clear lock — let the parent's timeout handle it
                        if (onHoverRoom) {
                          onHoverRoom(null);
                        }
                      }}
                      hitStrokeWidth={12}
                    />
                  </Group>
                );
              })}
          </Layer>
        </Stage>
      ) : (
        <div style={{ padding: "20px", color: "#94a3b8" }}>Loading Floor Plan PDF...</div>
      )}
    </div>
  );
}
