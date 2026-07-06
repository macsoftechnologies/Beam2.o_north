import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import ContractorForm from "../../forms/Contractorsform/Contractorform";
import { getContractors, addContractor, updateContractor, deleteContractor, getDepartments } from "../../services/authService";
import { API_BASE_URL } from "../../services/api";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const ActionButtons = ({ onView, onEdit, onDelete }) => (
  <div className="dept-action-btns">
    {/* <button className="dept-action-btn dept-action-btn--view" title="View" onClick={onView}>
      <FaEye />
    </button> */}
    <button className="dept-action-btn dept-action-btn--edit" title="Edit" onClick={onEdit}>
      <FaEdit />
    </button>
    <button className="dept-action-btn dept-action-btn--delete" title="Delete" onClick={onDelete}>
      <FaTrash />
    </button>
  </div>
);

const getLogoUrl = (logoVal) => {
  if (!logoVal) return null;
  if (logoVal.startsWith("data:") || logoVal.startsWith("http")) return logoVal;
  return `${API_BASE_URL}/subcontractors/${logoVal}`;
};

const Contractors = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [contractorList, setContractorList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Fetch subcontractors and departments
  const fetchContractors = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getContractors(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setContractorList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load contractors");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments(1, 100);
        const rows = res?.data?.rows ?? res?.data ?? res ?? [];
        setDepartments(rows);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchContractors(currentPage);
  }, [currentPage, fetchContractors]);

  const handleView = (item, index) => {
    setSelectedContractor({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedContractor({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteContractor(item.id);
      showDeleteSuccess();
      const newPage = contractorList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchContractors(newPage);
    } catch {
      showError("Failed to delete contractor");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append("subContractorName", formData.subContractorName);
      formDataObj.append("departId", formData.departId);
      // Status field removed
      if (formData.logoFile) {
        formDataObj.append("logo", formData.logoFile);
      } else if (formData.logoCleared) {
        formDataObj.append("logo", "");
      }

      if (selectedContractor && editOpen) {
        await updateContractor(selectedContractor.id, formDataObj);
        showSuccess("Contractor updated successfully");
        setEditOpen(false);
        setSelectedContractor(null);
      } else {
        await addContractor(formDataObj);
        showSuccess("Contractor added successfully");
        setOpen(false);
      }
      fetchContractors(currentPage);
    } catch {
      showError("Operation failed");
    }
  };

  const totalPages = Math.ceil((totalCount || contractorList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Name", accessor: "name" },
    { header: "Department", accessor: "department" },
    { header: "Logo", accessor: "logoCell" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = contractorList.map((item, index) => {
    const matchedDept = departments.find(d => String(d.id) === String(item.departId));
    const deptName = matchedDept ? matchedDept.departmentName : "—";
    const logoUrl = getLogoUrl(item.logo);
    return {
      ...item,
      serial: startIndex + index + 1,
      name: item.subContractorName,
      department: deptName,
      logoCell: logoUrl ? (
        <img src={logoUrl} alt={`${item.subContractorName} logo`} className="dept-logo-thumb" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
      ) : (
        <span className="dept-no-logo">No Logo</span>
      ),
      actions: (
        <ActionButtons
          onView={() => handleView(item, index)}
          onEdit={() => handleEdit(item, index)}
          onDelete={() => handleDelete(item)}
        />
      ),
    };
  });

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Contractors</h1>
          <p className="dept-page-subtitle">Manage and configure all contractor records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || contractorList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedContractor(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Contractor
          </button>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Contractor" size="lg" type="default">
        <ContractorForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contractor" size="lg" type="warning">
        <ContractorForm isEdit initialData={selectedContractor} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Contractor Details" size="md" type="info">
        {selectedContractor && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Contractor Name</span>
              <span className="dept-view-value">{selectedContractor.subContractorName}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Department</span>
              <span className="dept-view-value dept-view-value--code">
                {departments.find(d => String(d.id) === String(selectedContractor.departId))?.departmentName || "—"}
              </span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Logo</span>
              {getLogoUrl(selectedContractor.logo) ? (
                <img src={getLogoUrl(selectedContractor.logo)} alt="logo" className="dept-view-logo" />
              ) : (
                <span className="dept-view-value">No logo uploaded</span>
              )}
            </div>
            {/* Status removed */}
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedContractor.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Contractors;