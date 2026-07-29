import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import ElectricalWorksForm from "../../forms/ElectricalWorksform/ElectricalWorksform";
import { getElectricalWorks, addElectricalWork, updateElectricalWork, deleteElectricalWork } from "../../services/authService";
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

const ElectricalWorks = () => {
  const [open, setOpen]                                   = useState(false);
  const [editOpen, setEditOpen]                           = useState(false);
  const [viewOpen, setViewOpen]                           = useState(false);
  const [selectedElectricalWork, setSelectedElectricalWork] = useState(null);
  const [electricalWorkList, setElectricalWorkList]       = useState([]);
  const [currentPage, setCurrentPage]                     = useState(1);
  const [pageLimit]                                       = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount]                       = useState(0);
  const [isLoading, setIsLoading]                         = useState(false);
  const [filterSearch, setFilterSearch]                   = useState("");
  const [appliedSearch, setAppliedSearch]                 = useState("");

  // Fetch electrical works
  const fetchElectricalWorks = useCallback(async (page = 1, searchKeyword = appliedSearch) => {
    setIsLoading(true);
    try {
      const res = await getElectricalWorks(page, pageLimit, searchKeyword);
      const rows = res?.data ?? res ?? [];
      const count = res?.total ?? rows.length;
      setElectricalWorkList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load electrical works");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, appliedSearch]);

  useEffect(() => {
    fetchElectricalWorks(currentPage, appliedSearch);
  }, [currentPage, appliedSearch, fetchElectricalWorks]);

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
    setSelectedElectricalWork({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedElectricalWork({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteElectricalWork(item.id);
      showDeleteSuccess();
      const newPage = electricalWorkList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchElectricalWorks(newPage, appliedSearch);
    } catch {
      showError("Failed to delete electrical work");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedElectricalWork && editOpen) {
        await updateElectricalWork(selectedElectricalWork.id, formData);
        showSuccess("Electrical Work updated successfully");
        setEditOpen(false);
        setSelectedElectricalWork(null);
      } else {
        await addElectricalWork(formData);
        showSuccess("Electrical Work added successfully");
        setOpen(false);
      }
      fetchElectricalWorks(currentPage, appliedSearch);
    } catch {
      showError("Operation failed");
    }
  };

  const totalPages = Math.ceil((totalCount || electricalWorkList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No",            accessor: "serial"          },
    { header: "Module Number",   accessor: "moduleNumber"    },
    { header: "Electrical Work", accessor: "electricalWork"  },
    { header: "Actions",         accessor: "actions"         },
  ];

  const tableData = electricalWorkList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    moduleNumber: item.module || "—",
    electricalWork: item.electrical_works || "—",
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
          <h1 className="dept-page-title">Electrical Works</h1>
          <p className="dept-page-subtitle">Manage and configure all electrical work records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || electricalWorkList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedElectricalWork(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Electrical Work
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ELECTRICAL WORK</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by electrical work name"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Electrical Work" size="lg" type="default">
        <ElectricalWorksForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Electrical Work" size="lg" type="warning">
        <ElectricalWorksForm isEdit initialData={selectedElectricalWork} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Electrical Work Details" size="md" type="info">
        {selectedElectricalWork && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Module Number</span>
              <span className="dept-view-value dept-view-value--code">{selectedElectricalWork.module || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Electrical Work</span>
              <span className="dept-view-value">{selectedElectricalWork.electrical_works || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedElectricalWork.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ElectricalWorks;