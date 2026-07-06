import React, { useState, useEffect } from "react";
import { getBuildings, getFloors } from "../../services/authService";
import "../../forms/styles/forms.css";

const STATUS_OPTIONS = [
  "Under Construction",
  "Commissioning",
  "Hand Over",
];

function ZoneForm({ onClose, initialData, isEdit, onSubmit }) {
  const [building, setBuilding] = useState(""); // building_id
  const [level, setLevel] = useState(""); // floor_id
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("Under Construction");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [filteredFloorsList, setFilteredFloorsList] = useState([]);

  // Fetch buildings and floors
  useEffect(() => {
    const fetchBuildingsAndFloors = async () => {
      try {
        const [buildingsRes, floorsRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000)
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
      } catch (err) {
        console.error("Failed to fetch buildings or floors", err);
      }
    };
    fetchBuildingsAndFloors();
  }, []);

  useEffect(() => {
    if (isEdit && initialData) {
      setBuilding(initialData.building_id || "");
      setLevel(initialData.floor_id || "");
      setZone(initialData.zone || "");
      setStatus(initialData.status || "Under Construction");
    }
  }, [initialData, isEdit]);

  // Filter levels based on selected building
  useEffect(() => {
    if (building && floorsList.length > 0) {
      const filtered = floorsList.filter(f => String(f.build_id) === String(building));
      setFilteredFloorsList(filtered);
    } else {
      setFilteredFloorsList([]);
    }
  }, [building, floorsList]);

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setBuilding(bId);
    setLevel(""); // Reset floor when building changes
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!building || !level || !zone.trim()) return;

    const matchedFloor = floorsList.find(f => String(f.fl_id) === String(level));
    const levelName = matchedFloor ? matchedFloor.floor_name : "";

    const payload = {
      building_id: building ? Number(building) : null,
      floor_id: level ? Number(level) : null,
      level: levelName,
      zone: zone.trim(),
      status
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
            value={building}
            onChange={handleBuildingChange}
            required
          >
            <option value="">Select Building</option>
            {buildingsList.map((b) => (
              <option key={b.build_id} value={b.build_id}>{b.building_name}</option>
            ))}
          </select>
        </div>

        {/* Level / Floor */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Level / Floor <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
            disabled={!building}
          >
            <option value="">Select Level</option>
            {filteredFloorsList.map((l) => (
              <option key={l.fl_id} value={l.fl_id}>{l.floor_name}</option>
            ))}
          </select>
        </div>

        {/* Zone Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Zone Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g. Restricted Lab B"
            required
          />
        </div>

        {/* Status */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Status <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!building || !level || !zone.trim()}>
          {isEdit ? "Update Zone" : "Add Zone"}
        </button>
      </div>
    </form>
  );
}

export default ZoneForm;
