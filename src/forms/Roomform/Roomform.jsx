import React, { useState, useEffect } from "react";
import { getBuildings, getFloors, getZones } from "../../services/authService";
import "../../forms/styles/forms.css";

function RoomForm({ onClose, initialData, isEdit, onSubmit }) {
  const [building, setBuilding] = useState(""); // building_id
  const [floor, setFloor] = useState(""); // fl_id
  const [zone, setZone] = useState(""); // zone_id
  const [roomName, setRoomName] = useState("");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [filteredFloorsList, setFilteredFloorsList] = useState([]);
  const [filteredZonesList, setFilteredZonesList] = useState([]);

  // Fetch buildings, floors, and zones
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [buildingsRes, floorsRes, zonesRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setZonesList(zonesRes?.data ?? []);
      } catch (err) {
        console.error("Failed to fetch location data", err);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (isEdit && initialData) {
      setRoomName(initialData.room_name || "");
      setFloor(initialData.fl_id || "");
      setZone(initialData.zone_id || "");
      setBuilding(initialData.building_id || "");

      // Fallback: Resolve building id from floor if building_id is missing
      if (!initialData.building_id && initialData.fl_id && floorsList.length > 0) {
        const matched = floorsList.find(f => String(f.fl_id) === String(initialData.fl_id));
        if (matched) {
          setBuilding(matched.build_id || "");
        }
      }
    }
  }, [initialData, isEdit, floorsList]);

  // Filter levels based on selected building
  useEffect(() => {
    if (building && floorsList.length > 0) {
      const filtered = floorsList.filter(f => String(f.build_id) === String(building));
      setFilteredFloorsList(filtered);
    } else {
      setFilteredFloorsList([]);
    }
  }, [building, floorsList]);

  // Filter zones based on selected floor
  useEffect(() => {
    if (floor && zonesList.length > 0) {
      const filtered = zonesList.filter(z => String(z.floor_id) === String(floor));
      setFilteredZonesList(filtered);
    } else {
      setFilteredZonesList([]);
    }
  }, [floor, zonesList]);

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setBuilding(bId);
    setFloor(""); // Reset floor when building changes
    setZone("");  // Reset zone when building changes
  };

  const handleFloorChange = (e) => {
    const fId = e.target.value;
    setFloor(fId);
    setZone("");  // Reset zone when floor changes
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!building || !floor || !zone || !roomName.trim()) return;

    const payload = {
      building_id: Number(building),
      fl_id: Number(floor),
      zone_id: Number(zone),
      room_name: roomName.trim()
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

        {/* Floor Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Floor / Level <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={floor}
            onChange={handleFloorChange}
            required
            disabled={!building}
          >
            <option value="">Select Floor</option>
            {filteredFloorsList.map((l) => (
              <option key={l.fl_id} value={l.fl_id}>{l.floor_name}</option>
            ))}
          </select>
        </div>

        {/* Zone Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Zone <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
            disabled={!floor}
          >
            <option value="">Select Zone</option>
            {filteredZonesList.map((z) => (
              <option key={z.id ?? z.zoneStatusId} value={z.id ?? z.zoneStatusId}>{z.zone}</option>
            ))}
          </select>
        </div>

        {/* Room Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Room Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Conference Room 101"
            required
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!building || !floor || !zone || !roomName.trim()}>
          {isEdit ? "Update Room" : "Add Room"}
        </button>
      </div>
    </form>
  );
}

export default RoomForm;
