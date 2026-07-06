import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

function MechanicalWorksform({ onClose, initialData, isEdit, onSubmit }) {
  const [mechanicalWork, setMechanicalWork] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setMechanicalWork(initialData.mechanical_works || initialData.mechanicalWork || "");
    }
  }, [initialData, isEdit]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      mechanical_works: mechanicalWork
    };

    if (isEdit && (initialData?.id !== undefined ? initialData.id : initialData?.mechanicalWorkId)) {
      payload.id = initialData.id !== undefined ? initialData.id : initialData.mechanicalWorkId;
    }

    onSubmit && onSubmit(payload);
    onClose  && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Mechanical Work */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Mechanical Work <span className="df-required">*</span>
          </label>
          <textarea
            className="df-input"
            value={mechanicalWork}
            onChange={(e) => setMechanicalWork(e.target.value)}
            placeholder="Mechanical Work"
            rows={4}
            required
            style={{ resize: "vertical" }}
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
          {isEdit ? "Update Mechanical Work" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default MechanicalWorksform;