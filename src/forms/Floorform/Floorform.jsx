import React, { useState, useEffect } from "react";
import { getBuildings } from "../../services/authService";
import "../../forms/styles/forms.css";

function FloorForm({ onClose, initialData, isEdit, onSubmit }) {
  const [buildId, setBuildId] = useState("");
  const [floorName, setFloorName] = useState("");
  const [floorStatus, setFloorStatus] = useState("Active");
  const [floorImage, setFloorImage] = useState("");

  const [buildingsList, setBuildingsList] = useState([]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await getBuildings(1, 1000);
        const rows = res?.data ?? res ?? [];
        setBuildingsList(rows);
      } catch (err) {
        console.error("Failed to load buildings", err);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (isEdit && initialData) {
      setBuildId(initialData.build_id || "");
      setFloorName(initialData.floor_name || "");
      setFloorStatus(initialData.floor_status || "Active");
      setFloorImage(initialData.floor_image || "");
    }
  }, [initialData, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!floorName.trim() || !buildId) return;

    const payload = {
      build_id: Number(buildId),
      floor_name: floorName,
      // floor_status: floorStatus,
      // floor_image: floorImage || "ground_floor_layout.png"
    };
    onSubmit && onSubmit(payload);
    onClose && onClose();
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Building Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Building <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={buildId}
            onChange={(e) => setBuildId(e.target.value)}
            required
          >
            <option value="">Select Building</option>
            {buildingsList.map((b) => (
              <option key={b.build_id} value={b.build_id}>
                {b.building_name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Floor Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            placeholder="e.g. Ground Floor"
            required
          />
        </div>

        {/* Status */}
        {/* <div className="df-field df-field--full">
          <label className="df-label">
            Status <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={floorStatus}
            onChange={(e) => setFloorStatus(e.target.value)}
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
        <button type="submit" className="df-btn df-btn--submit" disabled={!floorName.trim() || !buildId}>
          {isEdit ? "Update Floor" : "Add Floor"}
        </button>
      </div>
    </form>
  );
}

export default FloorForm;
