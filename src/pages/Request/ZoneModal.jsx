import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { pdfjs } from "react-pdf";
import PdfPolygonViewer from "../../components/PdfPolygonViewer";

// Configure PDFJS worker path locally in Vite to prevent CORS/CDN errors
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function ZoneModal({
  zone,
  selectedRooms: globalSelectedRooms = [],
  onClose,
  onConfirm,
}) {
  const [selectedRooms, setSelectedRooms] = useState(globalSelectedRooms);
  const [viewerWidth, setViewerWidth] = useState(900);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pdf");
  const containerRef = useRef(null);

  // Sync selected rooms when global selections change or modal opens
  useEffect(() => {
    setSelectedRooms(globalSelectedRooms);
  }, [globalSelectedRooms]);

  const toggleRoom = (roomName) => {
    setSelectedRooms((prev) =>
      prev.includes(roomName)
        ? prev.filter((r) => r !== roomName)
        : [...prev, roomName]
    );
  };

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {

    if (!containerRef.current) return;

    const resize = () => {
      const isMobile = window.innerWidth <= 1024;
      const padding = isMobile ? 20 : 40; // 10px each side on mobile, 20px on desktop
      const calculatedWidth = containerRef.current.clientWidth - padding;

      // On mobile, let the PDF scale down to fit the container width (min 280px)
      // On desktop, keep a minimum width of 600px for usability
      const minWidth = isMobile ? 280 : 600;
      setViewerWidth(Math.max(minWidth, calculatedWidth));
    };

    resize();

    window.addEventListener("resize", resize);

    return () =>
      window.removeEventListener("resize", resize);

  }, [activeTab]);

  return ReactDOM.createPortal(
    <div
      className="zone-modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 20000000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="zone-modal-content"
        style={{
          width: "95vw",
          height: "92vh",
          maxWidth: "1600px",
          background: "#111827",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @media (max-width: 1024px) {
            .zone-modal-mobile-tabs {
              display: flex !important;
            }
            .zone-modal-body {
              grid-template-columns: 1fr !important;
              grid-template-rows: 1fr !important;
              overflow-y: hidden !important;
            }
            .zone-modal-body.show-pdf .zone-modal-sidebar {
              display: none !important;
            }
            .zone-modal-body.show-rooms .zone-modal-pdf-container {
              display: none !important;
            }
            .zone-modal-pdf-container {
              padding: 10px !important;
            }
            .zone-modal-sidebar {
              height: 100% !important;
              border-left: none !important;
              border-top: none !important;
            }
            .modal-room-list {
              max-height: none !important;
              flex: 1 !important;
            }
          }
        `}</style>

        {/* Header */}
        <div
          className="zone-modal-header"
          style={{
            height: "65px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
            Zone {zone.name} - Select Rooms
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Mobile Tab Navigation */}
        <div
          className="zone-modal-mobile-tabs"
          style={{
            display: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#111827",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab("pdf")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "pdf" ? "#1f2937" : "transparent",
              color: activeTab === "pdf" ? "#3b82f6" : "#9ca3af",
              border: "none",
              borderBottom: activeTab === "pdf" ? "2px solid #3b82f6" : "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            PDF Floor Plan
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "rooms" ? "#1f2937" : "transparent",
              color: activeTab === "rooms" ? "#3b82f6" : "#9ca3af",
              border: "none",
              borderBottom: activeTab === "rooms" ? "2px solid #3b82f6" : "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Rooms Checklist ({selectedRooms.length})
          </button>
        </div>

        {/* Two-Column Content Layout */}
        <div
          className={`zone-modal-body ${activeTab === "pdf" ? "show-pdf" : "show-rooms"}`}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 340px",
            flex: 1,
            overflow: "hidden",
            background: "#151d30",
          }}
        >
          {/* Left Panel: PDF Viewer */}
          <div
            className="zone-modal-pdf-container"
            ref={containerRef}
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              justifyContent: containerRef.current && viewerWidth > containerRef.current.clientWidth ? "flex-start" : "center",
              alignItems: "flex-start",
              padding: 20,
              background: "#1b2436",
            }}
          >
            <PdfPolygonViewer
              pdf={zone.pdf}
              rooms={zone.rooms}
              width={viewerWidth}
              selectedRooms={selectedRooms}
              toggleRoom={toggleRoom}
            />
          </div>

          {/* Right Panel: Rooms Directory Sidebar */}
          <div
            className="zone-modal-sidebar"
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#111827",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <h4 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}>
                Rooms Directory
              </h4>
              <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "11px" }}>
                Select rooms to allocate permit work
              </p>
              <div style={{ marginTop: "12px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    paddingLeft: "32px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "#1f2937",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    fontSize: "13px",
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
              </div>
            </div>

            <div
              className="modal-room-list"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                overflowY: "auto",
                flex: 1,
                background: "#111827",
              }}
            >
              {zone.rooms
                .filter((room) => {
                  const roomName = typeof room === "object" ? room.name : room;
                  return (roomName || "").toLowerCase().includes((searchTerm || "").toLowerCase().trim());
                })
                .map((room) => {
                  const roomName = typeof room === "object" ? room.name : room;
                  const key = typeof room === "object" ? (room.id || room.name) : room;
                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 8,
                        cursor: "pointer",
                        color: "#f3f4f6",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(roomName)}
                        onChange={() => toggleRoom(roomName)}
                      />
                      {roomName}
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="zone-modal-footer"
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#111827",
            flexShrink: 0,
          }}
        >
          <button
            className="df-btn df-btn-secondary"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="df-btn df-btn-primary"
            onClick={() => onConfirm && onConfirm(selectedRooms)}
            style={{
              background: "#2563eb",
              border: "none",
              color: "#fff",
              padding: "8px 24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ZoneModal;