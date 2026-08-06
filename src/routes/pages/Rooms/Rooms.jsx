import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import RoomForm from "../../forms/Roomform/Roomform";
import { addRoom, getRooms, updateRoom, deleteRoom, getBuildings, getFloors, getZones } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Rooms = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomList, setRoomList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [filterRoomName, setFilterRoomName] = useState("");
  const [appliedRoomName, setAppliedRoomName] = useState("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUserRole(parsed.role || parsed.userType || "");
      } else {
        setUserRole(localStorage.getItem("UserType") || "");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── Fetch building, floor, and zone maps ───────────────────────────────────
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const [buildingsRes, floorsRes, zonesRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        setBuildings(buildingsRes?.data ?? []);
        setFloors(floorsRes?.data ?? []);
        setZones(zonesRes?.data ?? []);
      } catch (err) {
        console.error("Failed to load map data", err);
      }
    };
    fetchMaps();
  }, []);

  const floorMap = {};
  floors.forEach((f) => {
    floorMap[f.fl_id] = f;
  });

  const buildingMap = {};
  buildings.forEach((b) => {
    buildingMap[b.build_id] = b.building_name;
  });

  const zoneMap = {};
  zones.forEach((z) => {
    zoneMap[z.id ?? z.zoneStatusId] = z.zone;
  });

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || roomList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchRoomsList = useCallback(async (page = 1, searchKeyword = appliedRoomName) => {
    setIsLoading(true);
    try {
      const res = await getRooms(page, pageLimit, "", searchKeyword);
      const rawData = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rawData.length;
      setRoomList(rawData);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, appliedRoomName]);

  useEffect(() => {
    fetchRoomsList(currentPage, appliedRoomName);
  }, [currentPage, appliedRoomName, fetchRoomsList]);

  const handleFilter = () => {
    setCurrentPage(1);
    setAppliedRoomName(filterRoomName);
  };

  const handleClear = () => {
    setFilterRoomName("");
    setAppliedRoomName("");
    setCurrentPage(1);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedRoom({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteRoom(item.room_id ?? item.id);
      showDeleteSuccess();
      const newPage = roomList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchRoomsList(newPage, appliedRoomName);
    } catch (err) {
      showError("Failed to delete room");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedRoom && editOpen) {
        await updateRoom(selectedRoom.room_id ?? selectedRoom.id, formData);
        showSuccess("Room updated successfully");
        setEditOpen(false);
        setSelectedRoom(null);
      } else {
        await addRoom(formData);
        showSuccess("Room added successfully");
        setOpen(false);
      }
      fetchRoomsList(currentPage, appliedRoomName);
    } catch (err) {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building", accessor: "buildingName" },
    { header: "Floor / Level", accessor: "floorName" },
    { header: "Zone Name", accessor: "zoneName" },
    { header: "Room Name", accessor: "room_name" },
  ];

  const tableData = roomList.map((item, index) => {
    const flObj = floorMap[item.fl_id];
    const floorName = flObj ? flObj.floor_name : "—";
    const buildingName = item.building_id ? (buildingMap[item.building_id] || "—") : (flObj ? (buildingMap[flObj.build_id] || "—") : "—");
    const zoneName = zoneMap[item.zone_id] || "—";

    return {
      ...item,
      serial: startIndex + index + 1,
      floorName,
      buildingName,
      zoneName,
    };
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">

      {/* ── Page Header ── */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Rooms</h1>
          <p className="dept-page-subtitle">
            Manage and configure all room records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || roomList.length} Total
          </span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ROOM NAME</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by room name"
                value={filterRoomName}
                onChange={(e) => setFilterRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </div>
            <div className="filters-actions">
              <button
                onClick={handleFilter}
                type="button"
                className="dept-add-btn"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff', border: '1.5px solid #38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.35)', transition: 'all 0.2s ease' }}
              >
                <FaSearch style={{ marginRight: '6px' }} /> Search
              </button>
              <button
                onClick={handleClear}
                type="button"
                className="dept-add-btn"
                style={{ background: 'rgba(14,165,233,0.07)', color: '#9ca3af', border: '1.5px solid rgba(14,165,233,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}
              >
                <FaTimes style={{ marginRight: '6px' }} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="dept-table-card">
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      {/* ── Add Modal ── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Room"
        size="md"
        type="default"
      >
        <RoomForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedRoom(null); }}
        title="Edit Room"
        size="md"
        type="warning"
      >
        <RoomForm
          isEdit
          initialData={selectedRoom}
          onClose={() => { setEditOpen(false); setSelectedRoom(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Rooms;
