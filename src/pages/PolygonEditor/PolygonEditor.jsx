import { useState } from "react";
import useMeasure from "react-use-measure";

import Toolbar from "../../components/Toolbar";
import EditorStage from "../../components/EditorStage";

export default function PolygonEditor() {
    const [ref, bounds] = useMeasure();
    const [pdfFile, setPdfFile] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentPolygon, setCurrentPolygon] = useState([]);

    const handleLoadPdf = (file) => {
        console.log(file);
        setPdfFile(file);
    };

    const exportJson = () => {
        if (rooms.length === 0) {
            alert("No rooms to export.");
            return;
        }

        const blob = new Blob(
            [JSON.stringify(rooms, null, 2)],
            {
                type: "application/json",
            }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "rooms.json";
        a.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="editor">
            <Toolbar
                onLoadPdf={handleLoadPdf}
                onExportJson={exportJson}
            />

            <div ref={ref} className="viewer">
                {pdfFile && bounds.width > 0 ? (
                    <EditorStage
                        pdf={pdfFile}
                        containerWidth={bounds.width}
                        rooms={rooms}
                        setRooms={setRooms}
                        currentPolygon={currentPolygon}
                        setCurrentPolygon={setCurrentPolygon}
                    />
                ) : (
                    <div
                        style={{
                            marginTop: 100,
                            fontSize: 22,
                            color: "#666",
                        }}
                    >
                        Click "Load PDF" to begin
                    </div>
                )}
            </div>
        </div>
    );
}