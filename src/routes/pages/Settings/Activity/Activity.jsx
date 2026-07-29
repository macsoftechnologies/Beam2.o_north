import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import Activityform from "../../../forms/Activityform/Activityform";
import { getActivities, addActivity, updateActivity, deleteActivity } from "../../../services/authService";
import "../../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Activity = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityList, setActivityList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Fetch list with Backend Search & Pagination ─────────────────────────
  const fetchActivities = useCallback(async (page = 1, query = "") => {
    setIsLoading(true);
    try {
      const res = await getActivities(page, pageLimit, query);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setActivityList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchActivities(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchActivities]);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / pageLimit));
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedActivity({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteActivity(item.id);
      showDeleteSuccess();
      const newPage = activityList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchActivities(newPage, searchTerm);
    } catch {
      showError("Failed to delete activity");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedActivity && editOpen) {
        await updateActivity(selectedActivity.id, formData);
        showSuccess("Activity updated successfully");
        setEditOpen(false);
        setSelectedActivity(null);
      } else {
        await addActivity(formData);
        showSuccess("Activity added successfully");
        setOpen(false);
      }
      fetchActivities(currentPage, searchTerm);
    } catch {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Activity Name", accessor: "activityName" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = activityList.map((item, index) => ({
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
          <h1 className="dept-page-title">Activity</h1>
          <p className="dept-page-subtitle">
            Manage and configure all activity records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedActivity(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Activity
          </button>
        </div>
      </div>

      {/* ── Search Toolbar ── */}
      <div style={{
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "var(--bg-card, #111827)",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-color, #374151)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "360px", display: "flex", alignItems: "center" }}>
          <FaSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted, #9ca3af)", fontSize: "14px" }} />
          <input
            type="text"
            placeholder="Search activity name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "8px 36px 8px 36px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #374151)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-main, #f9fafb)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
                padding: "2px"
              }}
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <span style={{ fontSize: "13px", color: "var(--text-muted, #9ca3af)" }}>
            Found <strong style={{ color: "var(--text-main, #f9fafb)" }}>{totalCount}</strong> matching activities
          </span>
        )}
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
        title="Add Activity"
        size="md"
        type="default"
      >
        <Activityform
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedActivity(null); }}
        title="Edit Activity"
        size="md"
        type="warning"
      >
        <Activityform
          isEdit
          initialData={selectedActivity}
          onClose={() => { setEditOpen(false); setSelectedActivity(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Activity;