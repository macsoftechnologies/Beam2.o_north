import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

function Activityform({ onClose, initialData, isEdit, onSubmit }) {
  const [activityName, setActivityName] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setActivityName(initialData.activityName || "");
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activityName.trim()) return;

    const payload = { activityName: activityName.trim() };
    onSubmit && onSubmit(payload);
    onClose && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Activity Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Activity Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="e.g. Welding and Cutting"
            required
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!activityName.trim()}>
          {isEdit ? "Update Activity" : "Add Activity"}
        </button>
      </div>
    </form>
  );
}

export default Activityform;