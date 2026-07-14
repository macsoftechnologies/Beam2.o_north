import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
import BuildingForm from "../../forms/Buildingform/Buildingform";
import { addBuilding, getBuildings, updateBuilding, deleteBuilding } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Buildings = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingList, setBuildingList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || buildingList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchBuildingsList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getBuildings(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setBuildingList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load buildings");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchBuildingsList(currentPage);
  }, [currentPage, fetchBuildingsList]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedBuilding({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteBuilding(item.build_id ?? item.id);
      showDeleteSuccess();
      const newPage = buildingList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchBuildingsList(newPage);
    } catch (err) {
      showError("Failed to delete building");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedBuilding && editOpen) {
        await updateBuilding(selectedBuilding.build_id ?? selectedBuilding.id, formData);
        showSuccess("Building updated successfully");
        setEditOpen(false);
        setSelectedBuilding(null);
      } else {
        await addBuilding(formData);
        showSuccess("Building added successfully");
        setOpen(false);
      }
      fetchBuildingsList(currentPage);
    } catch (err) {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building Name", accessor: "building_name" },
    { header: "Status", accessor: "building_status" },
    { header: "Actions", accessor: "actions" },
  ];

  const isAuthorized = ["superadmin", "admin"].includes(String(userRole).toLowerCase());

  const tableData = buildingList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
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
          <h1 className="dept-page-title">Buildings</h1>
          <p className="dept-page-subtitle">
            Manage and configure all building records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || buildingList.length} Total
          </span>
          {/* <button
            className="dept-add-btn"
            onClick={() => { setSelectedBuilding(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Building
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
        title="Add Building"
        size="md"
        type="default"
      >
        <BuildingForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedBuilding(null); }}
        title="Edit Building"
        size="md"
        type="warning"
      >
        <BuildingForm
          isEdit
          initialData={selectedBuilding}
          onClose={() => { setEditOpen(false); setSelectedBuilding(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Buildings;
