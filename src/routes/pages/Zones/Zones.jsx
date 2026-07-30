import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash, FaFilter, FaFileCsv, FaArrowDown, FaTimes, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import ZoneForm from "../../forms/Zoneform/Zoneform";
import { getZones, addZone, updateZone, deleteZone, getBuildings } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Zones = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneList, setZoneList] = useState([]);
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

  const [filterZoneName, setFilterZoneName] = useState("");
  const [filterStatus, setFilterStatus] = useState(location.state?.status || "");

  const statusLabelMap = {
    UC: "Construction",
    C: "Commissioning",
    HO: "Hand Over",
  };

  useEffect(() => {
    if (location.state?.status) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
  const totalPages = Math.ceil((totalCount || zoneList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchZonesList = useCallback(async (page = 1, zoneKeyword = filterZoneName, statusFilter = filterStatus) => {
    setIsLoading(true);
    try {
      const res = await getZones(page, pageLimit, zoneKeyword, "", "", false, statusFilter);
      const rawData = res?.data ?? (Array.isArray(res) ? res : []);
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      const count = res?.total ?? (Array.isArray(rawData) ? rawData.length : (rawData?.count ?? 0));
      setZoneList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load zones");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, filterZoneName, filterStatus]);

  useEffect(() => {
    fetchZonesList(currentPage);
  }, [currentPage]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchZonesList(1, filterZoneName, filterStatus);
  };

  const handleClear = () => {
    setFilterZoneName("");
    setFilterStatus("");
    setCurrentPage(1);
    fetchZonesList(1, "", "");
  };

  const handleExportCSV = async () => {
    try {
      const res = await getZones(1, 100000, filterZoneName, "", "", true, filterStatus);
      const rows = res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Building", "Level / Floor", "Zone Name", "Status"];
      const csvRows = rows.map((item, index) => {
        return [
          index + 1,
          `"${(buildingMap[item.building_id] || "—").replace(/"/g, '""')}"`,
          `"${(item.level || "").replace(/"/g, '""')}"`,
          `"${(item.zone || "").replace(/"/g, '""')}"`,
          `"${(statusLabelMap[item.status] ?? item.status ?? "").replace(/"/g, '""')}"`
        ].join(",");
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Zones_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
      const res = await getZones(1, 100000, filterZoneName, "", "", true, filterStatus);
      const rows = res?.data ?? res ?? [];
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Building", "Level / Floor", "Zone Name", "Status"];
      const wsData = [
        headers,
        ...rows.map((item, index) => [
          index + 1,
          buildingMap[item.building_id] || "—",
          item.level || "",
          item.zone || "",
          statusLabelMap[item.status] ?? item.status ?? ""
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Zones");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Zones_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedZone({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteZone(item.id ?? item.zoneStatusId);
      showDeleteSuccess();
      const newPage = zoneList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchZonesList(newPage);
    } catch (err) {
      showError("Failed to delete zone");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedZone && editOpen) {
        await updateZone(selectedZone.id ?? selectedZone.zoneStatusId, formData);
        showSuccess("Zone updated successfully");
        setEditOpen(false);
        setSelectedZone(null);
      } else {
        await addZone(formData);
        showSuccess("Zone added successfully");
        setOpen(false);
      }
      fetchZonesList(currentPage);
    } catch (err) {
      showError("Operation failed");
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building", accessor: "buildingName" },
    { header: "Level / Floor", accessor: "level" },
    { header: "Zone Name", accessor: "zone" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const isAuthorized = ["superadmin", "admin"].includes(String(userRole).toLowerCase());

  const tableData = zoneList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    buildingName: buildingMap[item.building_id] || "—",
    status: statusLabelMap[item.status] ?? item.status,
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
          <h1 className="dept-page-title">Zones</h1>
          <p className="dept-page-subtitle">
            Manage and configure all zone records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || zoneList.length} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedZone(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Zone
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ZONE NAME</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by zone name"
                value={filterZoneName}
                onChange={(e) => setFilterZoneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </div>
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>STATUS</label>
              <select className="df-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="UC">Construction</option>
                <option value="C">Commissioning</option>
                <option value="HO">Hand Over</option>
              </select>
            </div>
            <div className="filters-actions">
              <button onClick={handleFilter} type="button" className="dept-add-btn" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff', border: '1.5px solid #38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.35)', transition: 'all 0.2s ease' }}>
                <FaSearch style={{ marginRight: '6px' }} /> Search
              </button>
              <button onClick={handleClear} type="button" className="dept-add-btn" style={{ background: 'rgba(14,165,233,0.07)', color: '#9ca3af', border: '1.5px solid rgba(14,165,233,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}>
                <FaTimes style={{ marginRight: '6px' }} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
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

      {/* ── Add Modal ── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Zone"
        size="md"
        type="default"
      >
        <ZoneForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedZone(null); }}
        title="Edit Zone"
        size="md"
        type="warning"
      >
        <ZoneForm
          isEdit
          initialData={selectedZone}
          onClose={() => { setEditOpen(false); setSelectedZone(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Zones;
