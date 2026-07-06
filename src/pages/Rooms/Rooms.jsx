import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
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
  const fetchRoomsList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getRooms(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setRoomList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchRoomsList(currentPage);
  }, [currentPage, fetchRoomsList]);

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
      fetchRoomsList(newPage);
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
      fetchRoomsList(currentPage);
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
    { header: "Actions", accessor: "actions" },
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
      actions: (
        <div className="dept-action-btns">
          <button
            className="dept-action-btn dept-action-btn--edit"
            title="Edit"
            onClick={() => handleEdit(item, index)}
          >
            <FaEdit />
          </button>
          <button
            className="dept-action-btn dept-action-btn--delete"
            title="Delete"
            onClick={() => handleDelete(item)}
          >
            <FaTrash />
          </button>
        </div>
      ),
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
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedRoom(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Room
          </button>
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
