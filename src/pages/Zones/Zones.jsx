import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
import ZoneForm from "../../forms/Zoneform/Zoneform";
import { getZones, addZone, updateZone, deleteZone, getBuildings } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Zones = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneList, setZoneList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);

  // ─── Fetch building mapping ───────────────────────────────────────────────
  useEffect(() => {
    const fetchB = async () => {
      try {
        const res = await getBuildings(1, 1000);
        const rows = res?.data ?? res ?? [];
        setBuildings(rows);
      } catch (err) {
        console.error("Failed to load buildings map", err);
      }
    };
    fetchB();
  }, []);

  // Build building lookup map
  const buildingMap = {};
  buildings.forEach((b) => {
    buildingMap[b.build_id] = b.building_name;
  });

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || zoneList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchZonesList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getZones(page, pageLimit);
      const rows = res?.data ?? res ?? [];
      const count = res?.total ?? rows.length;
      setZoneList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load zones");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchZonesList(currentPage);
  }, [currentPage, fetchZonesList]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedZone({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteZone(item.id ?? item.zoneStatusId);
      showDeleteSuccess();
      const newPage = zoneList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchZonesList(newPage);
    } catch (err) {
      showError("Failed to delete zone");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedZone && editOpen) {
        await updateZone(selectedZone.id ?? selectedZone.zoneStatusId, formData);
        showSuccess("Zone updated successfully");
        setEditOpen(false);
        setSelectedZone(null);
      } else {
        await addZone(formData);
        showSuccess("Zone added successfully");
        setOpen(false);
      }
      fetchZonesList(currentPage);
    } catch (err) {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building", accessor: "buildingName" },
    { header: "Level / Floor", accessor: "level" },
    { header: "Zone Name", accessor: "zone" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = zoneList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    buildingName: buildingMap[item.building_id] || "—",
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
  }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">

      {/* ── Page Header ── */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Zones</h1>
          <p className="dept-page-subtitle">
            Manage and configure all zone records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || zoneList.length} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedZone(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Zone
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
        title="Add Zone"
        size="md"
        type="default"
      >
        <ZoneForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedZone(null); }}
        title="Edit Zone"
        size="md"
        type="warning"
      >
        <ZoneForm
          isEdit
          initialData={selectedZone}
          onClose={() => { setEditOpen(false); setSelectedZone(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Zones;
