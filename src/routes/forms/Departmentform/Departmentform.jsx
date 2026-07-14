import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

function DepartmentForm({ onClose, initialData, isEdit, onSubmit }) {
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setDepartmentName(initialData.departmentName || "");
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { departmentName };
    onSubmit && onSubmit(payload);
    onClose && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>

      <div className="df-grid">

        {/* Department Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Department Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="e.g. Human Resources"
            required
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit">
          {isEdit ? "Update Department" : "Add Department"}
        </button>
      </div>

    </form>
  );
}

export default DepartmentForm;