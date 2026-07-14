import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import { FaEdit, FaTrash } from "react-icons/fa";
import Activityform from "../../../forms/Activityform/Activityform";
import { getActivities, addActivity, updateActivity, deleteActivity } from "../../../services/authService";
import "../../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Activity = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityList, setActivityList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || activityList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchActivities = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getActivities(page, pageLimit);
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
    fetchActivities(currentPage);
  }, [currentPage, fetchActivities]);

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
      fetchActivities(newPage);
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
      fetchActivities(currentPage);
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
            {totalCount || activityList.length} Total
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