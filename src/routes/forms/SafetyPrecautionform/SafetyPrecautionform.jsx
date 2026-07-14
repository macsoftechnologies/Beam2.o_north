import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

function SafetyPrecautionform({ onClose, initialData, isEdit, onSubmit }) {
  const [precaution, setPrecaution] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setPrecaution(initialData.precaution || "");
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!precaution.trim()) return;

    const payload = { precaution: precaution.trim() };
    onSubmit && onSubmit(payload);
    onClose && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Safety Precaution */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Safety Precaution <span className="df-required">*</span>
          </label>
          <textarea
            className="df-input"
            value={precaution}
            onChange={(e) => setPrecaution(e.target.value)}
            placeholder="Safety Precaution"
            rows={4}
            required
            style={{ resize: "vertical" }}
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!precaution.trim()}>
          {isEdit ? "Update Safety Precaution" : "Add Safety Precaution"}
        </button>
      </div>
    </form>
  );
}

export default SafetyPrecautionform;