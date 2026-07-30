import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import MechanicalWorksForm from "../../forms/MechanicalWorksform/MechanicalWorksform";
import { getMechanicalWorks, addMechanicalWork, updateMechanicalWork, deleteMechanicalWork } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const ActionButtons = ({ onView, onEdit, onDelete }) => (
  <div className="dept-action-btns">
    <button className="dept-action-btn dept-action-btn--view" title="View" onClick={onView}>
      <FaEye />
    </button>
    <button className="dept-action-btn dept-action-btn--edit" title="Edit" onClick={onEdit}>
      <FaEdit />
    </button>
    <button className="dept-action-btn dept-action-btn--delete" title="Delete" onClick={onDelete}>
      <FaTrash />
    </button>
  </div>
);

const MechanicalWorks = () => {
  const [open, setOpen]                                     = useState(false);
  const [editOpen, setEditOpen]                             = useState(false);
  const [viewOpen, setViewOpen]                             = useState(false);
  const [selectedMechanicalWork, setSelectedMechanicalWork] = useState(null);
  const [mechanicalWorkList, setMechanicalWorkList]         = useState([]);
  const [currentPage, setCurrentPage]                       = useState(1);
  const [pageLimit]                                         = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount]                       = useState(0);
  const [isLoading, setIsLoading]                         = useState(false);
  const [filterSearch, setFilterSearch]                     = useState("");
  const [appliedSearch, setAppliedSearch]                   = useState("");

  // Fetch mechanical works
  const fetchMechanicalWorks = useCallback(async (page = 1, searchKeyword = appliedSearch) => {
    setIsLoading(true);
    try {
      const res = await getMechanicalWorks(page, pageLimit, searchKeyword);
      const rows = res?.data ?? res ?? [];
      const count = res?.total ?? rows.length;
      setMechanicalWorkList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load mechanical works");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, appliedSearch]);

  useEffect(() => {
    fetchMechanicalWorks(currentPage, appliedSearch);
  }, [currentPage, appliedSearch, fetchMechanicalWorks]);

  const handleFilter = () => {
    setCurrentPage(1);
    setAppliedSearch(filterSearch);
  };

  const handleClear = () => {
    setFilterSearch("");
    setAppliedSearch("");
    setCurrentPage(1);
  };

  const handleView = (item, index) => {
    setSelectedMechanicalWork({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedMechanicalWork({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteMechanicalWork(item.id);
      showDeleteSuccess();
      const newPage = mechanicalWorkList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchMechanicalWorks(newPage, appliedSearch);
    } catch {
      showError("Failed to delete mechanical work");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedMechanicalWork && editOpen) {
        await updateMechanicalWork(selectedMechanicalWork.id, formData);
        showSuccess("Mechanical Work updated successfully");
        setEditOpen(false);
        setSelectedMechanicalWork(null);
      } else {
        await addMechanicalWork(formData);
        showSuccess("Mechanical Work added successfully");
        setOpen(false);
      }
      fetchMechanicalWorks(currentPage, appliedSearch);
    } catch {
      showError("Operation failed");
    }
  };

  const totalPages = Math.ceil((totalCount || mechanicalWorkList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No",             accessor: "serial"          },
    { header: "Mechanical Work",  accessor: "mechanicalWork"  },
    { header: "Actions",          accessor: "actions"         },
  ];

  const tableData = mechanicalWorkList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    mechanicalWork: item.mechanical_works || "—",
    actions: (
      <ActionButtons
        onView={() => handleView(item, index)}
        onEdit={() => handleEdit(item, index)}
        onDelete={() => handleDelete(item)}
      />
    ),
  }));

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Mechanical Works</h1>
          <p className="dept-page-subtitle">Manage and configure all mechanical work records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || mechanicalWorkList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedMechanicalWork(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Mechanical Work
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>MECHANICAL WORK</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by mechanical work name"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Mechanical Work" size="lg" type="default">
        <MechanicalWorksForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Mechanical Work" size="lg" type="warning">
        <MechanicalWorksForm isEdit initialData={selectedMechanicalWork} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Mechanical Work Details" size="md" type="info">
        {selectedMechanicalWork && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Mechanical Work</span>
              <span className="dept-view-value dept-view-value--code">{selectedMechanicalWork.mechanical_works || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedMechanicalWork.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default MechanicalWorks;