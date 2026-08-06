import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash, FaFilter, FaFileCsv, FaArrowDown, FaTimes, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import ContractorForm from "../../forms/Contractorsform/Contractorform";
import { getContractors, addContractor, updateContractor, deleteContractor, getDepartments } from "../../services/authService";
import { API_BASE_URL } from "../../services/api";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;  

const LogoCell = ({ logoUrl, name, size = 45 }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (name) => {
    if (!name) return "??";
    // Remove HTML entities like &amp; or # amp;
    let cleanName = name.replace(/&\w+;/g, "").replace(/#\s*\w+;/g, "");
    // Remove other non-alphanumeric characters, keeping spaces
    cleanName = cleanName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return "??";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  const roundedSize = Math.max(8, Math.floor(size * 0.22));

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="dept-logo-thumb"
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', borderRadius: `${roundedSize}px` }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#4285F4',
        color: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: `${roundedSize}px`,
        fontWeight: 'bold',
        fontSize: `${Math.floor(size * 0.4)}px`,
        letterSpacing: '1px'
      }}
    >
      {getInitials(name)}
    </div>
  );
};

const ActionButtons = ({ onView, onEdit, onDelete, showDelete }) => (
  <div className="dept-action-btns">
    {/* <button className="dept-action-btn dept-action-btn--view" title="View" onClick={onView}>
      <FaEye />
    </button> */}
    <button className="dept-action-btn dept-action-btn--edit" title="Edit" onClick={onEdit}>
      <FaEdit />
    </button>
    {showDelete && (
      <button className="dept-action-btn dept-action-btn--delete" title="Delete" onClick={onDelete}>
        <FaTrash />
      </button>
    )}
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
  const [userRole, setUserRole] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

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

  // Fetch subcontractors and departments
  const fetchContractors = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const res = await getContractors(page, pageLimit, false, search);
      const rawData = res?.data ?? (Array.isArray(res) ? res : []);
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      const count = res?.total ?? (Array.isArray(rawData) ? rawData.length : (rawData?.count ?? 0));
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

  // Fetch when page or applied search changes
  useEffect(() => {
    fetchContractors(currentPage, appliedSearch);
  }, [currentPage, appliedSearch, fetchContractors]);

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
    setSelectedContractor({ ...item, serial: (currentPage - 1) * pageLimit + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedContractor({ ...item, serial: (currentPage - 1) * pageLimit + index + 1 });
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
      fetchContractors(newPage, appliedSearch);
    } catch {
      showError("Failed to delete contractor");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append("subContractorName", formData.subContractorName);
      formDataObj.append("departId", formData.departId);
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
      fetchContractors(currentPage, appliedSearch);
    } catch {
      showError("Operation failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await getContractors(1, 100000, true, appliedSearch);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Contractor Name", "Department"];
      const csvRows = rows.map((item, index) => {
        const matchedDept = departments.find(d => String(d.id) === String(item.departId));
        const deptName = matchedDept ? matchedDept.departmentName : "—";
        return [
          index + 1,
          `"${(item.subContractorName || "").replace(/"/g, '""')}"`,
          `"${(deptName || "").replace(/"/g, '""')}"`
        ].join(",");
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Contractors_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await getContractors(1, 100000, true, appliedSearch);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Contractor Name", "Department"];
      const wsData = [
        headers,
        ...rows.map((item, index) => {
          const matchedDept = departments.find(d => String(d.id) === String(item.departId));
          const deptName = matchedDept ? matchedDept.departmentName : "—";
          return [
            index + 1,
            item.subContractorName || "",
            deptName || ""
          ];
        })
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contractors");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Contractors_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  const totalPages = Math.ceil(totalCount / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Name", accessor: "name" },
    { header: "Logo", accessor: "logoCell" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = contractorList.map((item, index) => {
    const logoUrl = getLogoUrl(item.logo);
    const isAuthorized = ["superadmin", "admin"].includes(String(userRole).toLowerCase());
    return {
      ...item,
      serial: startIndex + index + 1,
      name: item.subContractorName,
      logoCell: <LogoCell logoUrl={logoUrl} name={item.subContractorName} size={45} />,
      actions: (
        <ActionButtons
          onView={() => handleView(item, index)}
          onEdit={() => handleEdit(item, index)}
          onDelete={() => handleDelete(item)}
          showDelete={isAuthorized}
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
          <span className="dept-count-badge">
            {totalCount} Total
          </span>
          <button className="dept-add-btn" onClick={() => { setSelectedContractor(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Contractor
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>CONTRACTOR COMPANY NAME</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by company name..."
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <button onClick={handleExportCSV} className="dept-add-btn" style={{ backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}>
            <FaFileCsv style={{ marginRight: '6px', fontSize: '1.1rem' }} /> CSV
          </button>
          <button onClick={handleExportExcel} className="dept-add-btn" style={{ backgroundColor: '#3B82F6', border: 'none', cursor: 'pointer' }}>
            <FaArrowDown style={{ marginRight: '6px' }} /> Excel
          </button>
        </div>
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
              <LogoCell logoUrl={getLogoUrl(selectedContractor.logo)} name={selectedContractor.subContractorName} size={80} />
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