export default function Toolbar({
    onLoadPdf,
    onExportJson,
}) {
    const handleFile = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        onLoadPdf(file);
    };

    return (
        <div className="toolbar">
            <label className="btn">
                Load PDF

                <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handleFile}
                />
            </label>

            <button>Undo</button>

            <button>Save Room</button>

            <button onClick={onExportJson}>
                Export JSON
            </button>
        </div>
    );
}