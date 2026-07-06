import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import DepartmentForm from "../../forms/Departmentform/Departmentform";
import { addDepartments, getDepartments, updateDepartment, deleteDepartment } from "../.././services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Departments = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentList, setDepartmentList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || departmentList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getDepartments(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setDepartmentList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchDepartments(currentPage);
  }, [currentPage, fetchDepartments]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleView = (item, index) => {
    setSelectedDepartment({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedDepartment({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteDepartment(item.id ?? item.departmentId);
      showDeleteSuccess();
      const newPage = departmentList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchDepartments(newPage);
    } catch {
      showError("Failed to delete department");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedDepartment && editOpen) {
        await updateDepartment({ id: selectedDepartment.id ?? selectedDepartment.departmentId, ...formData });
        showSuccess("Department updated successfully");
        setEditOpen(false);
        setSelectedDepartment(null);
      } else {
        await addDepartments(formData);
        showSuccess("Department added successfully");
        setOpen(false);
      }
      fetchDepartments(currentPage);
    } catch {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Name", accessor: "departmentName" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = departmentList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,

    actions: (
      <div className="dept-action-btns">
        {/* <button
          className="dept-action-btn dept-action-btn--view"
          title="View"
          onClick={() => handleView(item, index)}
        >
          <FaEye />
        </button> */}
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
          <h1 className="dept-page-title">Departments</h1>
          <p className="dept-page-subtitle">
            Manage and configure all department records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || departmentList.length} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedDepartment(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Department
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
        title="Add Department"
        size="md"
        type="default"
      >
        <DepartmentForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedDepartment(null); }}
        title="Edit Department"
        size="md"
        type="warning"
      >
        <DepartmentForm
          isEdit
          initialData={selectedDepartment}
          onClose={() => { setEditOpen(false); setSelectedDepartment(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── View Modal ── */}
      <Modal
        open={viewOpen}
        onClose={() => { setViewOpen(false); setSelectedDepartment(null); }}
        title="Department Details"
        size="md"
        type="info"
      >
        {selectedDepartment && (
          <div className="col-md-12">
            <div className="dept-view-item">
              <span className="dept-view-label">Department Name</span>
              <span className="dept-view-value">{selectedDepartment.departmentName ?? "—"}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Departments;