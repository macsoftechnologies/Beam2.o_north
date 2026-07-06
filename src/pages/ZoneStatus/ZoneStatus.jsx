import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import ZoneStatusForm from "../../forms/ZoneStatusform/ZoneStatusform";
import { getZones, addZone, updateZone, deleteZone, getBuildings } from "../../services/authService";
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

const StatusBadge = ({ status }) => (
  <span className={`dept-status-badge dept-status-badge--inactive`}>
    {status}
  </span>
);

const ZoneStatus = () => {
  const [open, setOpen]                             = useState(false);
  const [editOpen, setEditOpen]                     = useState(false);
  const [viewOpen, setViewOpen]                     = useState(false);
  const [selectedZoneStatus, setSelectedZoneStatus] = useState(null);
  const [zoneStatusList, setZoneStatusList]       = useState([]);
  const [currentPage, setCurrentPage]             = useState(1);
  const [pageLimit]                               = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount]               = useState(0);
  const [isLoading, setIsLoading]                 = useState(false);
  const [buildings, setBuildings]                 = useState([]);

  // Fetch zone statuses
  const fetchZoneStatuses = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getZones(page, pageLimit);
      const rows = res?.data ?? res ?? [];
      const count = res?.total ?? rows.length;
      setZoneStatusList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load zone status records");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  // Fetch buildings list for mapping
  useEffect(() => {
    const fetchB = async () => {
      try {
        const res = await getBuildings(1, 100);
        setBuildings(res?.data ?? []);
      } catch (err) {
        console.error("Failed to load buildings", err);
      }
    };
    fetchB();
  }, []);

  useEffect(() => {
    fetchZoneStatuses(currentPage);
  }, [currentPage, fetchZoneStatuses]);

  const handleView = (item, index) => {
    setSelectedZoneStatus({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedZoneStatus({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteZone(item.id);
      showDeleteSuccess();
      const newPage = zoneStatusList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchZoneStatuses(newPage);
    } catch {
      showError("Failed to delete zone status");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedZoneStatus && editOpen) {
        await updateZone(selectedZoneStatus.id, formData);
        showSuccess("Zone Status updated successfully");
        setEditOpen(false);
        setSelectedZoneStatus(null);
      } else {
        await addZone(formData);
        showSuccess("Zone Status added successfully");
        setOpen(false);
      }
      fetchZoneStatuses(currentPage);
    } catch {
      showError("Operation failed");
    }
  };

  const totalPages = Math.ceil((totalCount || zoneStatusList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // Build building lookup map
  const buildingMap = {};
  buildings.forEach(b => {
    buildingMap[b.build_id] = b.building_name;
  });

  const columns = [
    { header: "S.No",     accessor: "serial"   },
    { header: "Building", accessor: "building" },
    { header: "Level",    accessor: "level"    },
    { header: "Zone",     accessor: "zone"     },
    { header: "Status",   accessor: "status"   },
    { header: "Actions",  accessor: "actions"  },
  ];

  const tableData = zoneStatusList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    building: buildingMap[item.building_id] || "—",
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
          <h1 className="dept-page-title">Zone Status</h1>
          <p className="dept-page-subtitle">Manage and configure all zone status records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || zoneStatusList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedEmployee(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Zone Status
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Zone Status" size="lg" type="default">
        <ZoneStatusForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Zone Status" size="lg" type="warning">
        <ZoneStatusForm isEdit initialData={selectedZoneStatus} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Zone Status Details" size="md" type="info">
        {selectedZoneStatus && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Building</span>
              <span className="dept-view-value">{buildingMap[selectedZoneStatus.building_id] || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Level</span>
              <span className="dept-view-value dept-view-value--code">{selectedZoneStatus.level || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Zone</span>
              <span className="dept-view-value dept-view-value--code">{selectedZoneStatus.zone || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Status</span>
              <span className="dept-view-value">{selectedZoneStatus.status || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedZoneStatus.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ZoneStatus;