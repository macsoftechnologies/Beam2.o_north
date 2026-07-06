import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

// ─── Module Number options ────────────────────────────────────────────────────
const MODULE_NUMBER_OPTIONS = [
  "Panel Numbers",
  "System Numbers",
];

function ElectricalWorksform({ onClose, initialData, isEdit, onSubmit }) {
  const [moduleNumber,   setModuleNumber]   = useState("");
  const [electricalWork, setElectricalWork] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setModuleNumber(  initialData.module || initialData.moduleNumber || "");
      setElectricalWork(initialData.electrical_works || initialData.electricalWork || "");
    }
  }, [initialData, isEdit]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      module: moduleNumber,
      electrical_works: electricalWork
    };

    if (isEdit && (initialData?.id !== undefined ? initialData.id : initialData?.electricalWorkId)) {
      payload.id = initialData.id !== undefined ? initialData.id : initialData.electricalWorkId;
    }

    onSubmit && onSubmit(payload);
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Module Number */}
        <div className="df-field">
          <label className="df-label">
            Module Number <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={moduleNumber}
            onChange={(e) => setModuleNumber(e.target.value)}
            required
          >
            <option value="">Module Number</option>
            {MODULE_NUMBER_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Electrical Work */}
        <div className="df-field">
          <label className="df-label">
            Electrical Work <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={electricalWork}
            onChange={(e) => setElectricalWork(e.target.value)}
            placeholder="Electrical Work"
            required
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button
          type="button"
          className="df-btn df-btn--cancel"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="df-btn df-btn--submit"
        >
          {isEdit ? "Update Electrical Work" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default ElectricalWorksform;