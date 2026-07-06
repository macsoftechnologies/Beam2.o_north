import React, { useState, useEffect } from "react";
import { getBuildings, getFloors } from "../../services/authService";
import "../../forms/styles/forms.css";

// ─── Zone options ─────────────────────────────────────────────────────────────
const ZONE_OPTIONS = [
  "50.1L",
  "MU91.0R",
  "MU91.0S",
  "MU91.1A",
  "MU91.1F",
  "MU91.1G",
  "MU91.1H",
  "MU91.1M",
  "MU91.1N",
  "MU91.1P",
];

// ─── Status options ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  "Construction",
  "Commissioning",
  "Completed",
  "On Hold",
];

function ZoneStatusform({ onClose, initialData, isEdit, onSubmit }) {
  const [building, setBuilding] = useState(""); // Stores building_id
  const [level, setLevel]       = useState(""); // Stores floor_id
  const [zone, setZone]         = useState("");
  const [status, setStatus]     = useState("");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList]       = useState([]);
  const [filteredFloorsList, setFilteredFloorsList] = useState([]);

  // Fetch buildings and floors
  useEffect(() => {
    const fetchBuildingsAndFloors = async () => {
      try {
        const [buildingsRes, floorsRes] = await Promise.all([
          getBuildings(1, 100),
          getFloors(1, 100)
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
      setStatus(initialData.status || "");
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const matchedFloor = floorsList.find(f => String(f.fl_id) === String(level));
    const levelName = matchedFloor ? matchedFloor.floor_name : "";

    const payload = {
      building_id: building ? Number(building) : null,
      floor_id: level ? Number(level) : null,
      level: levelName,
      zone,
      status
    };

    if (isEdit && (initialData?.id !== undefined ? initialData.id : initialData?.zoneStatusId)) {
      payload.id = initialData.id !== undefined ? initialData.id : initialData.zoneStatusId;
    }

    onSubmit && onSubmit(payload);
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Building */}
        <div className="df-field">
          <label className="df-label">
            Building <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={building}
            onChange={handleBuildingChange}
            required
          >
            <option value="">Building</option>
            {buildingsList.map((b) => (
              <option key={b.build_id} value={b.build_id}>{b.building_name}</option>
            ))}
          </select>
        </div>

        {/* Level / Floor */}
        <div className="df-field">
          <label className="df-label">
            Level <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
            disabled={!building}
          >
            <option value="">Level</option>
            {filteredFloorsList.map((l) => (
              <option key={l.fl_id} value={l.fl_id}>{l.floor_name}</option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div className="df-field">
          <label className="df-label">
            Zone <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
          >
            <option value="">Zone</option>
            {ZONE_OPTIONS.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="df-field">
          <label className="df-label">
            Status <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          {isEdit ? "Update Zone Status" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default ZoneStatusform;