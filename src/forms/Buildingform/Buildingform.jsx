import React, { useState, useEffect } from "react";
import "../../forms/styles/forms.css";

function BuildingForm({ onClose, initialData, isEdit, onSubmit }) {
  const [buildingName, setBuildingName] = useState("");
  const [buildingStatus, setBuildingStatus] = useState("Active");
  const [buildingImage, setBuildingImage] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setBuildingName(initialData.building_name || "");
      setBuildingStatus(initialData.building_status || "Active");
      setBuildingImage(initialData.building_image || "");
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!buildingName.trim()) return;

    const payload = {
      building_name: buildingName,
      // building_status: buildingStatus,
      // building_image: buildingImage || "hq_wing_a.png",
      site_id: 5
    };
    onSubmit && onSubmit(payload);
    onClose && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Building Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Building Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder="e.g. Headquarters Wing A"
            required
          />
        </div>

        {/* Building Status */}
        {/* <div className="df-field df-field--full">
          <label className="df-label">
            Status <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={buildingStatus}
            onChange={(e) => setBuildingStatus(e.target.value)}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div> */}

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!buildingName.trim()}>
          {isEdit ? "Update Building" : "Add Building"}
        </button>
      </div>
    </form>
  );
}

export default BuildingForm;
