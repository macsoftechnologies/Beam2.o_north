import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
import SafetyPrecautionform from "../../../forms/SafetyPrecautionform/SafetyPrecautionform";
import { getPrecautions, addPrecaution, updatePrecaution, deletePrecaution } from "../../../services/authService";
import "../../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const SafetyPrecaution = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSafety, setSelectedSafety] = useState(null);
  const [safetyList, setSafetyList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || safetyList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchPrecautions = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getPrecautions(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setSafetyList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load safety precautions");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchPrecautions(currentPage);
  }, [currentPage, fetchPrecautions]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedSafety({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deletePrecaution(item.id);
      showDeleteSuccess();
      const newPage = safetyList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchPrecautions(newPage);
    } catch {
      showError("Failed to delete safety precaution");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedSafety && editOpen) {
        await updatePrecaution(selectedSafety.id, formData);
        showSuccess("Safety Precaution updated successfully");
        setEditOpen(false);
        setSelectedSafety(null);
      } else {
        await addPrecaution(formData);
        showSuccess("Safety Precaution added successfully");
        setOpen(false);
      }
      fetchPrecautions(currentPage);
    } catch {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Precaution", accessor: "precaution" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = safetyList.map((item, index) => ({
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
          <h1 className="dept-page-title">Safety Precaution</h1>
          <p className="dept-page-subtitle">
            Manage and configure all safety precaution records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || safetyList.length} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedSafety(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Safety Precaution
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
        title="Add Safety Precaution"
        size="md"
        type="default"
      >
        <SafetyPrecautionform
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedSafety(null); }}
        title="Edit Safety Precaution"
        size="md"
        type="warning"
      >
        <SafetyPrecautionform
          isEdit
          initialData={selectedSafety}
          onClose={() => { setEditOpen(false); setSelectedSafety(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default SafetyPrecaution;