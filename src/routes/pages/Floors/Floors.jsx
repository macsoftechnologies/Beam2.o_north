import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
import FloorForm from "../../forms/Floorform/Floorform";
import { addFloor, getFloors, updateFloor, deleteFloor, getBuildings } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Floors = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorList, setFloorList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [userRole, setUserRole] = useState("");

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
  const totalPages = Math.ceil((totalCount || floorList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchFloorsList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getFloors(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setFloorList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load floors");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchFloorsList(currentPage);
  }, [currentPage, fetchFloorsList]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedFloor({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteFloor(item.fl_id ?? item.id);
      showDeleteSuccess();
      const newPage = floorList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchFloorsList(newPage);
    } catch (err) {
      showError("Failed to delete floor");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedFloor && editOpen) {
        await updateFloor(selectedFloor.fl_id ?? selectedFloor.id, formData);
        showSuccess("Floor updated successfully");
        setEditOpen(false);
        setSelectedFloor(null);
      } else {
        await addFloor(formData);
        showSuccess("Floor added successfully");
        setOpen(false);
      }
      fetchFloorsList(currentPage);
    } catch (err) {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building", accessor: "buildingName" },
    { header: "Floor Name", accessor: "floor_name" },
    { header: "Status", accessor: "floor_status" },
    { header: "Actions", accessor: "actions" },
  ];

  const isAuthorized = ["superadmin", "admin"].includes(String(userRole).toLowerCase());

  const tableData = floorList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    buildingName: buildingMap[item.build_id] || "—",
    actions: (
      <div className="dept-action-btns">
        <button
          className="dept-action-btn dept-action-btn--edit"
          title="Edit"
          onClick={() => handleEdit(item, index)}
        >
          <FaEdit />
        </button>
        {isAuthorized && (
          <button
            className="dept-action-btn dept-action-btn--delete"
            title="Delete"
            onClick={() => handleDelete(item)}
          >
            <FaTrash />
          </button>
        )}
      </div>
    ),
  }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">

      {/* ── Page Header ── */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Floors</h1>
          <p className="dept-page-subtitle">
            Manage and configure all floor records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || floorList.length} Total
          </span>
          {/* <button
            className="dept-add-btn"
            onClick={() => { setSelectedFloor(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Floor
          </button> */}
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
        title="Add Floor"
        size="md"
        type="default"
      >
        <FloorForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedFloor(null); }}
        title="Edit Floor"
        size="md"
        type="warning"
      >
        <FloorForm
          isEdit
          initialData={selectedFloor}
          onClose={() => { setEditOpen(false); setSelectedFloor(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Floors;
