import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaEye, FaCopy, FaTrash, FaPlus, FaFilter, FaHistory, FaCheck, FaTimes, FaEllipsisV } from "react-icons/fa";
import {
  getContractors,
  getActivities,
  getBuildings,
  getFloors,
  getZones,
  getRooms,
  getUser
} from "../../../services/authService";
import {
  searchRequests,
  deleteRequest,
  deleteSelectedRequests,
  updateListStatusRequest,
  updateListReqstSafety,
  updateListReqstTime,
  addListReqstNote,
  getRequestsLogs,
  createByCount
} from "../../../services/requestService";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../../components/common/Toast/Toast";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import "./ListRequest.css";
import "../../styles/pages.css";
import "../../../forms/styles/forms.css";

const STATUS_OPTIONS = [
  "Hold",
  "Saved",
  "Opened",
  "Pre-Approved",
  "Approved",
  "Closed",
  "Rejected",
  "Cancelled",
  "Draft"
];

const HRA_LIST = [
  { key: "Hot_work", label: "Hot Work", icon: "HotWorks.png" },
  { key: "working_on_electrical_system", label: "Electrical Systems", icon: "ElectricalSystems.png" },
  { key: "working_hazardious_substen", label: "Hazardous Substances", icon: "substanceChemical.png" },
  { key: "pressure_tesing_of_equipment", label: "Testing Equipment", icon: "testingequipment.png" },
  { key: "working_at_height", label: "Working at Height", icon: "WorkingAtHight.png" },
  { key: "working_confined_spaces", label: "Confined Space", icon: "ConfinedSpace.png" },
  { key: "work_in_atex_area", label: "ATEX Area", icon: "ATEXarea.png" },
  { key: "securing_facilities", label: "Securing Facilities", icon: "SecuringFacilities.png" },
  { key: "excavation_works", label: "Excavation Works", icon: "ExcavationWorks.png" },
  { key: "using_cranes_or_lifting", label: "Cranes & Lifting", icon: "Craneslifting.png" },
  { key: "power_on", label: "Electrical Works", icon: "electrical_works.png" },
  { key: "pressurization", label: "Mechanical Works", icon: "mechanical1.png" }
];

const MultiSelectDropdown = ({
  placeholder,
  options = [],
  selectedValues = [],
  onChange = () => { },
  hasNone = false,
  isHra = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (value, checked) => {
    let nextValues = [...selectedValues];
    if (hasNone && value === "none") {
      if (checked) {
        nextValues = ["none"];
      } else {
        nextValues = [];
      }
    } else {
      if (checked) {
        nextValues = nextValues.filter(v => v !== "none");
        if (!nextValues.includes(value)) {
          nextValues.push(value);
        }
      } else {
        nextValues = nextValues.filter(v => v !== value);
      }
    }
    onChange(nextValues);
  };

  // Resolve trigger display label text
  let displayText = placeholder;
  if (selectedValues.length > 0) {
    if (hasNone && selectedValues.includes("none")) {
      displayText = "None";
    } else {
      const selectedLabels = [];

      // Flatten options to easily search labels
      const allOpts = [];
      options.forEach(opt => {
        if (opt.zones) {
          opt.zones.forEach(z => allOpts.push({ value: z, label: z }));
        } else {
          allOpts.push(opt);
        }
      });

      selectedValues.forEach(val => {
        const opt = allOpts.find(o => {
          const oVal = String(o?.value ?? o?.key ?? o?.id ?? o?.build_id ?? o);
          return oVal === String(val);
        });
        if (opt) {
          selectedLabels.push(opt.label || opt.building_name || opt.floor_name || opt.subContractorName || opt.zone || opt.value || opt.key || opt);
        }
      });

      if (selectedLabels.length > 0) {
        displayText = selectedLabels.join(", ");
      }
    }
  }

  return (
    <div ref={containerRef} className="custom-multiselect-container" style={{ position: "relative", width: "100%" }}>
      <div
        className="df-input"
        onClick={handleToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          paddingRight: "14px",
          opacity: disabled ? 0.6 : 1,
          color: displayText === placeholder ? "var(--text-muted, #9ca3af)" : "var(--text-main, #f9fafb)"
        }}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 24px)"
        }}>
          {displayText}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div
          className="custom-multiselect-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxHeight: "260px",
            overflowY: "auto",
            backgroundColor: "var(--bg-card, #111827)",
            border: "1.5px solid var(--border-color, #374151)",
            borderRadius: "12px",
            zIndex: 9999,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            padding: "6px 0"
          }}
        >
          {hasNone && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                color: "var(--text-main, #f9fafb)",
                backgroundColor: selectedValues.includes("none") ? "rgba(255, 255, 255, 0.05)" : "transparent",
                fontSize: "14px",
                userSelect: "none"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedValues.includes("none") ? "rgba(255, 255, 255, 0.05)" : "transparent"}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes("none")}
                onChange={(e) => handleCheckboxChange("none", e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
              />
              <span>None</span>
            </label>
          )}

          {options.map((opt, idx) => {
            const val = String(opt.value ?? opt.key ?? opt.id ?? opt.build_id ?? opt);
            const displayLabel = opt.label || opt.building_name || opt.floor_name || opt.subContractorName || opt;
            const isChecked = selectedValues.includes(val);

            return (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  color: "var(--text-main, #f9fafb)",
                  backgroundColor: isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent",
                  fontSize: "14px",
                  userSelect: "none"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isChecked ? "rgba(255, 255, 255, 0.05)" : "transparent"}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(val, e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                    accentColor: "var(--accent, #00e5a0)",
                    borderRadius: "4px"
                  }}
                />
                <span>{displayLabel}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ListRequest = () => {
  const navigate = useNavigate();
  const currentUser = getUser();

  // ─── Component States ──────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Dropdown options (from dynamic databases)
  const [contractors, setContractors] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);

  // Collapsible filters card
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Search Filter form state
  const [searchFilters, setSearchFilters] = useState({
    keyword: "",
    permitNo: "",
    contractors: [],
    statuses: [],
    buildings: [],
    levels: [],
    areas: [],
    hras: [],
    permitType: "",
    permitUnder: "",
    fromDate: "",
    toDate: "",
    startTime: "",
    endTime: "",
    nightShift: ""
  });

  // Modal Control States
  const [activeModal, setActiveModal] = useState(null); // 'status', 'time', 'safety', 'notes', 'logs', 'copy'
  const [modalTarget, setModalTarget] = useState(null); // Single request object or array of requests
  const [modalStatus, setModalStatus] = useState(""); // Open, Close, Rejected, Approved etc

  // Status Change Dialog Form inputs
  const [initials, setInitials] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [closeNote, setCloseNote] = useState("");

  // Bulk operation form inputs
  const [bulkTime, setBulkTime] = useState({ startTime: "", endTime: "", nightShift: false, newEndTime: "" });
  const [bulkSafety, setBulkSafety] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [logsData, setLogsData] = useState([]);
  const [copyDates, setCopyDates] = useState({ from: "", to: "" });

  // Check operator credentials
  const isAdmin = currentUser?.role === "Admin";
  const isDept = currentUser?.role === "Department";
  const isDept1 = currentUser?.role === "Department1";
  const isSubcontractor = currentUser?.role === "Subcontractor";
  const canBulkAction = isAdmin || isDept || isDept1;

  // ─── Fetch Selector Lists ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const [subRes, actRes, buildRes, floorRes, zoneRes] = await Promise.all([
          getContractors(1, 1000),
          getActivities(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        setContractors(subRes?.data?.rows ?? subRes?.data ?? subRes ?? []);
        setActivitiesList(actRes?.data?.rows ?? actRes?.data ?? actRes ?? []);
        setBuildingsList(buildRes?.data ?? []);
        setFloorsList(floorRes?.data ?? []);
        setZonesList(zoneRes?.data ?? []);
      } catch (err) {
        console.error("Failed to load selectors lists", err);
      }
    };
    fetchSelectors();
  }, []);

  // Filter levels based on selected buildings
  const filteredLevels = useMemo(() => {
    if (searchFilters.buildings.length === 0) return floorsList;
    return floorsList.filter(f => searchFilters.buildings.includes(String(f.build_id)));
  }, [searchFilters.buildings, floorsList]);

  // Filter zones based on selected levels
  const filteredZones = useMemo(() => {
    if (searchFilters.levels.length === 0) return zonesList;
    // Match floor IDs where name matches selected level strings
    const matchedFloorIds = floorsList
      .filter(f => searchFilters.levels.includes(f.floor_name))
      .map(f => String(f.fl_id));
    return zonesList.filter(z => matchedFloorIds.includes(String(z.floor_id)));
  }, [searchFilters.levels, zonesList, floorsList]);

  // ─── Fetch List Data ──────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const payload = {
        Activity: searchFilters.keyword || null,
        PermitNo: searchFilters.permitNo || null,
        Sub_Contractor_Id: searchFilters.contractors.length > 0 ? Number(searchFilters.contractors[0]) : null,
        Request_status: searchFilters.statuses.length > 0 ? searchFilters.statuses.join(",") : null,
        Building_Id: searchFilters.buildings.length > 0 ? Number(searchFilters.buildings[0]) : null,
        Room_Type: searchFilters.levels.length > 0 ? searchFilters.levels.join(",") : null,
        area: searchFilters.areas.length > 0 ? searchFilters.areas.join(",") : null,
        permit_type: searchFilters.permitType || "",
        permit_under: searchFilters.permitUnder || "",
        night_shift: searchFilters.nightShift || "",
        fromDate: searchFilters.fromDate || "",
        toDate: searchFilters.toDate || "",
        Start_Time: searchFilters.startTime ? `${searchFilters.startTime}:00` : "",
        End_Time: searchFilters.endTime ? `${searchFilters.endTime}:00` : "",
        Site_Id: 5,
        Page: page,
        End: limit
      };

      const hrasList = searchFilters.hras || [];
      if (hrasList.includes("none")) {
        payload.hras = 0;
      } else if (hrasList.length > 0) {
        payload.hras = 1;
        hrasList.forEach(key => {
          payload[key] = 1;
        });
      }

      const res = await searchRequests(payload);
      let rows = [];
      let count = 0;
      if (res && res.data) {
        if (Array.isArray(res.data) && res.data.length > 0 && res.data[0] && Array.isArray(res.data[0].data)) {
          rows = res.data[0].data;
        } else if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (res.data.rows) {
          rows = res.data.rows;
        }
        count = res.data[1]?.count ?? res.total ?? rows.length;
      } else if (Array.isArray(res)) {
        if (res.length > 0 && res[0] && Array.isArray(res[0].data)) {
          rows = res[0].data;
        } else {
          rows = res;
        }
        count = res[1]?.count ?? res.total ?? rows.length;
      }

      setRequests(rows);
      setTotalCount(Number(count));
      setSelectedIds([]); // reset selection
    } catch (err) {
      showError("Failed to fetch permit requests.");
    } finally {
      setIsLoading(false);
    }
  }, [searchFilters, limit]);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, fetchRequests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests(1);
  };

  const handleResetFilters = () => {
    setSearchFilters({
      keyword: "",
      permitNo: "",
      contractors: [],
      statuses: [],
      buildings: [],
      levels: [],
      areas: [],
      hras: [],
      permitType: "",
      permitUnder: "",
      fromDate: "",
      toDate: "",
      startTime: "",
      endTime: "",
      nightShift: ""
    });
    setCurrentPage(1);
  };

  // ─── Select Handling ───────────────────────────────────────────────────────
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(requests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked, id) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleRowDelete = async (row) => {
    const confirm = await showDeleteConfirm();
    if (!confirm.isConfirmed) return;
    try {
      await deleteRequest(row.id);
      showDeleteSuccess();
      fetchRequests(currentPage);
    } catch {
      showError("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = await showDeleteConfirm();
    if (!confirm.isConfirmed) return;
    try {
      await deleteSelectedRequests({ ids: selectedIds });
      showSuccess("Selected requests deleted successfully");
      fetchRequests(currentPage);
    } catch {
      showError("Delete failed");
    }
  };

  // View Logs Modal
  const handleViewLogs = async (row) => {
    try {
      const res = await getRequestsLogs(row.id);
      setLogsData(res?.data || []);
      setModalTarget(row);
      setActiveModal("logs");
    } catch {
      showError("Failed to fetch request history logs.");
    }
  };

  // Status transitions triggering dialogs
  const handleStatusTransition = (row, status) => {
    // Role based validations
    if (status === "Pre-Approved" || status === "Approved") {
      const permitUnder = row.permit_under || "";
      const isCom = row.permit_type === "Commissioning";
      if (!isAdmin) {
        if (isDept && isCom && status === "Pre-Approved") {
          return showError("Only COMM role can pre-approve Commissioning permits.");
        }
        if (isDept1 && !isCom && status === "Pre-Approved") {
          return showError("Only CONM role can pre-approve Construction permits.");
        }
      }
    }

    setModalTarget(row);
    setModalStatus(status);
    setInitials("");
    setRejectReason("");
    setCancelReason("");
    setCloseNote("");
    setActiveModal("status");
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!modalTarget) return;

    const payload = {
      id: String(modalTarget.id),
      Request_status: modalStatus,
      userId: currentUser?.id || 1,
      createdTime: new Date().toISOString().replace("T", " ").slice(0, 19)
    };

    if (modalStatus === "Rejected") {
      if (!rejectReason.trim()) return showError("Please specify rejection reason.");
      payload.reject_reason = rejectReason.trim();
    } else if (modalStatus === "Opened") {
      if (!initials.trim()) return showError("Supervisor/CONM initials signature required.");
      payload.ConM_initials1 = initials.trim();
    } else if (modalStatus === "Closed") {
      payload.close_note = closeNote.trim();
    } else {
      // Approved/Pre-Approved Signatures
      if (isDept) {
        payload.ConM_initials = initials.trim();
      } else if (isDept1) {
        payload.CoMM_initials = initials.trim();
      } else if (isAdmin) {
        payload.ConM_initials = initials.trim();
        payload.CoMM_initials = initials.trim();
      }
    }

    try {
      await updateListStatusRequest(payload);
      showSuccess(`Status changed to ${modalStatus} successfully`);
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Status update failed");
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = (status) => {
    if (selectedIds.length === 0) return;
    const targetRequests = requests.filter(r => selectedIds.includes(r.id));

    setModalTarget(targetRequests);
    setModalStatus(status);
    setInitials("");
    setRejectReason("");
    setActiveModal("status-bulk");
  };

  const handleBulkStatusSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: selectedIds.join(","),
      Request_status: modalStatus,
      userId: currentUser?.id || 1
    };

    if (modalStatus === "Rejected") {
      payload.reject_reason = rejectReason.trim();
    } else {
      if (isDept) payload.ConM_initials = initials.trim();
      if (isDept1) payload.CoMM_initials = initials.trim();
      if (isAdmin) {
        payload.ConM_initials = initials.trim();
        payload.CoMM_initials = initials.trim();
      }
    }

    try {
      await updateListStatusRequest(payload);
      showSuccess(`Selected permits status changed to ${modalStatus} successfully`);
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk status update failed");
    }
  };

  // Bulk Edit Dialogs
  const handleBulkTimeEdit = () => {
    setBulkTime({ startTime: "", endTime: "", nightShift: false, newEndTime: "" });
    setActiveModal("time");
  };

  const handleBulkTimeSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: selectedIds.join(","),
      Start_Time: bulkTime.startTime ? `${bulkTime.startTime}:00` : "",
      End_Time: bulkTime.endTime ? `${bulkTime.endTime}:00` : "",
      night_shift: bulkTime.nightShift ? 1 : 0,
      new_end_time: bulkTime.newEndTime ? `${bulkTime.newEndTime}:00` : "",
      logs: []
    };
    try {
      await updateListReqstTime(payload);
      showSuccess("Selected permits time/shift updated successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk time update failed");
    }
  };

  const handleBulkSafetyEdit = () => {
    setBulkSafety("");
    setActiveModal("safety");
  };

  const handleBulkSafetySubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: selectedIds.join(","),
      safety: bulkSafety.trim(),
      logs: []
    };
    try {
      await updateListReqstSafety(payload);
      showSuccess("Selected permits safety instructions updated successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk safety update failed");
    }
  };

  const handleBulkNotesEdit = () => {
    setBulkNote("");
    setActiveModal("notes");
  };

  const handleBulkNotesSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      request_id: selectedIds.join(","),
      permit_no: requests.filter(r => selectedIds.includes(r.id)).map(r => r.PermitNo).join(","),
      user_id: currentUser?.id || 1,
      username: currentUser?.displayName || currentUser?.username || "Operator",
      note: bulkNote.trim()
    };
    try {
      await addListReqstNote(payload);
      showSuccess("Selected permits note added successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Bulk notes submission failed");
    }
  };

  // Copy permit request to range
  const handleCopyTrigger = (row) => {
    setModalTarget(row);
    setCopyDates({ from: "", to: "" });
    setActiveModal("copy");
  };

  const handleCopySubmit = async (e) => {
    e.preventDefault();
    if (!copyDates.from || !copyDates.to) return showError("Please select date range.");

    const oneDay = 24 * 60 * 60 * 1000;
    const fromVal = new Date(copyDates.from);
    const toVal = new Date(copyDates.to);

    if (toVal < fromVal) return showError("End date cannot be earlier than start date.");
    const diffDays = Math.round(Math.abs((toVal - fromVal) / oneDay)) + 1;

    // Build zone array matching backend ZoneItemDto: { Zone_Id: number, zone: string }
    const zoneId = modalTarget.Zone_Id
      ? Number(modalTarget.Zone_Id)
      : (modalTarget.zone?.id ? Number(modalTarget.zone.id) : null);
    const zoneName = modalTarget.zone_name
      || (modalTarget.zone && typeof modalTarget.zone === "object" ? modalTarget.zone.zone : null)
      || modalTarget.zone
      || "";
    const zoneObjects = zoneId
      ? [{ Zone_Id: zoneId, zone: String(zoneName) }]
      : [];

    const payload = {
      userId: currentUser?.id || 1,
      Request_status: modalTarget.Request_status || "Pending",
      Room_Nos: modalTarget.Room_Nos,
      Room_Type: modalTarget.Room_Type,
      Site_Id: modalTarget.Site_Id ? Number(modalTarget.Site_Id) : 5,
      Start_Time: modalTarget.Start_Time,
      Sub_Contractor_Id: modalTarget.Sub_Contractor_Id ? Number(modalTarget.Sub_Contractor_Id) : null,
      Type_Of_Activity_Id: modalTarget.Type_Of_Activity_Id ? String(modalTarget.Type_Of_Activity_Id) : "",
      Assign_Start_Time: modalTarget.Start_Time,
      Assign_End_Time: modalTarget.End_Time,
      Assign_Start_Date: copyDates.from,
      Assign_End_Date: copyDates.to,
      Building_Id: modalTarget.Building_Id ? Number(modalTarget.Building_Id) : null,
      Company_Name: modalTarget.Company_Name,
      End_Time: modalTarget.End_Time,
      Floor_Id: modalTarget.Floor_Id ? Number(modalTarget.Floor_Id) : null,
      Foreman: modalTarget.Foreman,
      Foreman_Phone_Number: modalTarget.Foreman_Phone_Number,
      PermitNo: modalTarget.PermitNo,
      count: diffDays,
      createdTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      zone: zoneObjects
    };

    try {
      await createByCount(payload);
      showSuccess("Permits cloned successfully");
      setActiveModal(null);
      fetchRequests(currentPage);
    } catch {
      showError("Clone operation failed");
    }
  };

  // ─── Table Configuration ──────────────────────────────────────────────────
  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={requests.length > 0 && selectedIds.length === requests.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      accessor: "checkboxCell",
      style: { width: "40px", textAlign: "center" }
    },
    { header: "Permit Number", accessor: "PermitNo" },
    { header: "HRA'S", accessor: "hraCell" },
    { header: "Permit Under", accessor: "permit_under" },
    { header: "Request Date", accessor: "Request_Date" },
    { header: "Permit Type", accessor: "permit_type" },
    { header: "Activity", accessor: "Activity" },
    { header: "Contractor", accessor: "contractorName" },
    { header: "Building", accessor: "buildingName" },
    { header: "Area", accessor: "zone" },
    { header: "Level", accessor: "Room_Type" },
    { header: "Working Date", accessor: "Working_Date" },
    { header: "Time", accessor: "timeCell" },
    { header: "Night Shift", accessor: "nightShiftCell" },
    { header: "New End Time", accessor: "newEndTimeCell" },
    { header: "Status", accessor: "statusCell", className: "sticky-col-status" },
    { header: "Operations", accessor: "operationsCell", className: "sticky-col-operations", style: { width: "180px", minWidth: "180px", maxWidth: "180px" } }
  ];

  const tableData = useMemo(() => {
    return requests.map((row) => {
      // Find contractor name
      const contrObj = contractors.find(c => String(c.id) === String(row.Sub_Contractor_Id));
      const contractorName = contrObj ? contrObj.subContractorName : (row.Company_Name || "—");

      // Find building name
      const buildObj = buildingsList.find(b => Number(b.build_id) === Number(row.Building_Id));
      const buildingName = buildObj ? buildObj.building_name : "—";

      // Find area (zone) name safely
      const zoneName = (row.zone && typeof row.zone === "object")
        ? row.zone.zone
        : (row.zone || "—");

      // Find Level (Room_Type) name safely
      const roomTypeCell = (row.Room_Type && typeof row.Room_Type === "object")
        ? (row.Room_Type.floor_name || row.Room_Type.name || "—")
        : (row.Room_Type || "—");

      // Formatted Start/End time
      const timeCell = (row.Start_Time && row.End_Time)
        ? `${row.Start_Time.slice(0, 5)} - ${row.End_Time.slice(0, 5)}`
        : "—";

      // Night Shift status
      const nightShiftCell = (row.night_shift === 1 || row.night_shift === "1") ? "Yes" : "No";

      // New End Time value
      const newEndTimeCell = row.new_end_time ? row.new_end_time.slice(0, 5) : "—";

      // HRA icons logic
      const activeHras = HRA_LIST.filter(hra => row[hra.key] === 1 || row[hra.key] === "1" || row[hra.key] === true);
      const hraCell = (
        <div className="hra-icons-group">
          {activeHras.map((hra) => (
            <img
              key={hra.key}
              src={`/src/assets/images/logos/${hra.icon}`}
              alt={hra.label}
              className="hra-icon-thumb"
              title={hra.label}
            />
          ))}
          {activeHras.length === 0 && <span style={{ color: "#4b5563" }}>—</span>}
        </div>
      );

      // Status chip render
      const statusClass = `status-badge status-badge--${row.Request_status?.toLowerCase().replace(" ", "-")}`;

      const handleStatusClick = () => {
        // Subcontractor opening or closing permit
        if (isSubcontractor) {
          if (row.Request_status === "Approved") {
            const today = new Date().toISOString().split("T")[0];
            if (row.Working_Date === today) {
              handleStatusTransition(row, "Opened");
            } else {
              showError("Subcontractor can only open a permit on the active Working Date.");
            }
          } else if (row.Request_status === "Opened") {
            handleStatusTransition(row, "Closed");
          }
        }
        // Operator approving/pre-approving
        else if (canBulkAction) {
          if (row.Request_status === "Hold") {
            handleStatusTransition(row, "Pre-Approved");
          } else if (row.Request_status === "Pre-Approved") {
            handleStatusTransition(row, "Approved");
          } else if (row.Request_status === "Approved") {
            handleStatusTransition(row, "Opened");
          } else if (row.Request_status === "Opened") {
            handleStatusTransition(row, "Closed");
          }
        }
      };

      const statusCell = (
        <span
          className={statusClass}
          onClick={handleStatusClick}
          style={{ cursor: "pointer" }}
        >
          {row.Request_status}
        </span>
      );

      // Row action Operations rendering
      const isEditable = (isAdmin || isSubcontractor) &&
        row.Request_status !== "Cancelled" &&
        row.Request_status !== "Closed" &&
        row.Request_status !== "Rejected" &&
        currentUser?.role !== "Observer";

      const operationsCell = (
        <div className="list-operations-cell">
          {isEditable && (
            <button
              className="op-action-btn op-action-btn--edit"
              title="Edit Request"
              onClick={() => navigate("/new-request", { state: { editRequest: row } })}
            >
              <FaEdit />
            </button>
          )}

          <a
            href={`http://187.127.171.51/m3north/requests/permit-design/${row.PermitNo}`}
            target="_blank"
            rel="noreferrer"
            className="op-action-btn op-action-btn--view"
            title="View Details Drawing"
          >
            <FaEye />
          </a>

          {currentUser?.role !== "Observer" && (
            <button
              className="op-action-btn op-action-btn--copy"
              title="Clone/Copy Request"
              onClick={() => handleCopyTrigger(row)}
            >
              <FaCopy />
            </button>
          )}

          {isAdmin && (
            <button
              className="op-action-btn op-action-btn--delete"
              title="Delete Request"
              onClick={() => handleRowDelete(row)}
            >
              <FaTrash />
            </button>
          )}

          {/* <button
            className="op-action-btn op-action-btn--history"
            title="History Logs"
            onClick={() => handleViewLogs(row)}
          >
            <FaHistory />
          </button> */}
        </div>
      );

      return {
        ...row,
        checkboxCell: (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={(e) => handleSelectRow(e.target.checked, row.id)}
          />
        ),
        contractorName,
        buildingName,
        zone: zoneName,
        Room_Type: roomTypeCell,
        timeCell,
        nightShiftCell,
        newEndTimeCell,
        hraCell,
        statusCell,
        operationsCell
      };
    });
  }, [requests, selectedIds, contractors, buildingsList, isSubcontractor, canBulkAction, isAdmin, currentUser]);

  const totalPages = Math.ceil(totalCount / limit);

  // ─── Render UI ────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">
      {/* Page Header */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Work Permits &amp; Requests</h1>
          <p className="dept-page-subtitle">Track, filter, sign, and manage all active safety work permits</p>
        </div>
        <div className="dept-page-header__right">
          <button
            className="filters-toggle-btn"
            onClick={() => setFiltersOpen(p => !p)}
            style={{ marginRight: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", height: "42px", padding: "0 16px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <FaFilter />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
          </button>
          {currentUser?.role !== "Observer" && (
            <button className="dept-add-btn" onClick={() => navigate("/new-request")}>
              <FaPlus style={{ marginRight: "6px" }} />
              New Permit Request
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Search Filters Card */}
      {filtersOpen && (
        <div className="form-card filters-card-wrapper premium-form-container">
          <form onSubmit={handleSearchSubmit} className="df-form">
            <div className="df-grid df-grid--4-cols">
              <div className="df-field">
                <label className="df-label">Permit Number</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="e.g. 82389714..."
                  value={searchFilters.permitNo}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitNo: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Keyword (Activity)</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="e.g. Piping, welding..."
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Contractor</label>
                <MultiSelectDropdown
                  placeholder="Select Contractors"
                  options={contractors}
                  selectedValues={searchFilters.contractors}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, contractors: vals }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Permit Status</label>
                <MultiSelectDropdown
                  placeholder="Select Statuses"
                  options={STATUS_OPTIONS}
                  selectedValues={searchFilters.statuses}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, statuses: vals }))}
                />
              </div>
            </div>

            <div className="df-grid df-grid--4-cols" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Building</label>
                <MultiSelectDropdown
                  placeholder="Select Buildings"
                  options={buildingsList}
                  selectedValues={searchFilters.buildings}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, buildings: vals, levels: [], areas: [] }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Level / Floor</label>
                <MultiSelectDropdown
                  placeholder="Select Levels"
                  options={filteredLevels.map(f => f.floor_name)}
                  selectedValues={searchFilters.levels}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, levels: vals, areas: [] }))}
                  disabled={searchFilters.buildings.length === 0}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Area / Zone</label>
                <MultiSelectDropdown
                  placeholder="Select Areas"
                  options={filteredZones.map(z => z.zone)}
                  selectedValues={searchFilters.areas}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, areas: vals }))}
                  disabled={searchFilters.levels.length === 0}
                />
              </div>

              <div className="df-field">
                <label className="df-label">HRA Checklists</label>
                <MultiSelectDropdown
                  placeholder="Select HRA Checklists"
                  options={HRA_LIST.map(h => ({ ...h, image: '/src/assets/images/logos/' + h.icon }))}
                  selectedValues={searchFilters.hras}
                  onChange={(vals) => setSearchFilters(prev => ({ ...prev, hras: vals }))}
                  hasNone={true}
                  isHra={true}
                />
              </div>
            </div>

            <div className="df-grid df-grid--4-cols" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Permit Type</label>
                <select
                  className="df-select"
                  value={searchFilters.permitType}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitType: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
              </div>

              <div className="df-field">
                <label className="df-label">Permit Under</label>
                <select
                  className="df-select"
                  value={searchFilters.permitUnder}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, permitUnder: e.target.value }))}
                >
                  <option value="">All Areas</option>
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
              </div>

              <div className="df-field">
                <label className="df-label">Working Date range (From)</label>
                <input
                  type="date"
                  className="df-input"
                  value={searchFilters.fromDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Working Date range (To)</label>
                <input
                  type="date"
                  className="df-input"
                  value={searchFilters.toDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="df-grid df-grid--4-cols" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Start Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={searchFilters.startTime}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">End Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={searchFilters.endTime}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>

              <div className="df-field">
                <label className="df-label">Night Shift</label>
                <select
                  className="df-select"
                  value={searchFilters.nightShift}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, nightShift: e.target.value }))}
                >
                  <option value="">All Shifts</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="df-footer" style={{ justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="button"
                className="df-btn df-btn--cancel"
                onClick={handleResetFilters}
              >
                Reset
              </button>
              <button
                type="submit"
                className="df-btn df-btn--submit"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Operations Toolbar Block */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-toolbar animate-slide-in">
          <div className="bat-info">
            <span className="bat-badge">{selectedIds.length}</span>
            <span>Permits selected for bulk actions:</span>
          </div>
          <div className="bat-buttons">
            {canBulkAction && (
              <>
                <button
                  className="bat-btn bat-btn--approve"
                  onClick={() => handleBulkStatusChange("Pre-Approved")}
                  title="Bulk Pre-Approve"
                >
                  <FaCheck style={{ marginRight: "6px" }} />
                  Pre-Approve
                </button>
                <button
                  className="bat-btn bat-btn--approve-final"
                  onClick={() => handleBulkStatusChange("Approved")}
                  title="Bulk Approve"
                >
                  <FaCheck style={{ marginRight: "6px" }} />
                  Approve
                </button>
                <button
                  className="bat-btn bat-btn--reject"
                  onClick={() => handleBulkStatusChange("Rejected")}
                  title="Bulk Reject"
                >
                  <FaTimes style={{ marginRight: "6px" }} />
                  Reject
                </button>

                {/* Operations Dropdown */}
                <div className="bulk-edit-dropdown-container">
                  <button className="bat-btn bat-btn--edit">
                    Bulk Edit Controls
                  </button>
                  <div className="bulk-edit-dropdown-menu">
                    <button onClick={handleBulkTimeEdit}>Shift &amp; Working Time</button>
                    <button onClick={handleBulkSafetyEdit}>Safety Precautions</button>
                    <button onClick={handleBulkNotesEdit}>Add Note</button>
                  </div>
                </div>
              </>
            )}

            {isAdmin && (
              <button
                className="bat-btn bat-btn--delete"
                onClick={handleBulkDelete}
                title="Bulk Delete Requests"
              >
                <FaTrash style={{ marginRight: "6px" }} />
                Delete Selected
              </button>
            )}

            <button
              className="bat-btn bat-btn--cancel"
              onClick={() => setSelectedIds([])}
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="dept-table-card" style={{ marginTop: "16px" }}>
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      {/* ── Modals implementation ────────────────────────────────────────────── */}

      {/* Modal: Status Change */}
      <Modal
        open={activeModal === "status"}
        onClose={() => setActiveModal(null)}
        title={`Request Status Change: ${modalStatus}`}
        size="md"
        type={modalStatus === "Rejected" ? "danger" : "default"}
      >
        {modalTarget && (
          <form onSubmit={handleStatusSubmit} className="df-form">
            <div style={{ marginBottom: "16px" }}>
              <p style={{ color: "#d1d5db", fontSize: "14px" }}>
                Changing status of Permit No: <strong style={{ color: "#fff" }}>{modalTarget.PermitNo}</strong>
              </p>
            </div>

            {/* Initials signature prompt */}
            {(modalStatus === "Pre-Approved" || modalStatus === "Approved" || modalStatus === "Opened") && (
              <div className="df-field" style={{ marginBottom: "16px" }}>
                <label className="df-label">
                  Initials Signature <span className="df-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your initials..."
                  className="df-input"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                />
                <span style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Signing as roles: {currentUser?.role} ({currentUser?.displayName})
                </span>
              </div>
            )}

            {/* Rejection reason */}
            {modalStatus === "Rejected" && (
              <div className="df-field" style={{ marginBottom: "16px" }}>
                <label className="df-label">
                  Rejection Reason <span className="df-required">*</span>
                </label>
                <textarea
                  required
                  placeholder="Type rejection comments..."
                  className="df-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            {/* Close Checklist note */}
            {modalStatus === "Closed" && (
              <div className="df-field" style={{ marginBottom: "16px" }}>
                <label className="df-label">
                  Closing Notes / Remarks
                </label>
                <textarea
                  placeholder="Enter comments on close-out checklists..."
                  className="df-textarea"
                  rows={3}
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                />
              </div>
            )}

            <div className="df-footer">
              <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="df-btn df-btn--submit">
                Confirm Status Transition
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Bulk Status Change */}
      <Modal
        open={activeModal === "status-bulk"}
        onClose={() => setActiveModal(null)}
        title={`Bulk Status Change to: ${modalStatus}`}
        size="md"
        type="warning"
      >
        <form onSubmit={handleBulkStatusSubmit} className="df-form">
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#d1d5db" }}>
              Updating status of <strong style={{ color: "#fff" }}>{selectedIds.length}</strong> selected requests.
            </p>
          </div>

          {(modalStatus === "Pre-Approved" || modalStatus === "Approved") && (
            <div className="df-field" style={{ marginBottom: "16px" }}>
              <label className="df-label">
                Initials Signature <span className="df-required">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your initials..."
                className="df-input"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
              />
            </div>
          )}

          {modalStatus === "Rejected" && (
            <div className="df-field" style={{ marginBottom: "16px" }}>
              <label className="df-label">
                Rejection Reason <span className="df-required">*</span>
              </label>
              <textarea
                required
                placeholder="Type rejection comments..."
                className="df-textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}

          <div className="df-footer">
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Apply Status to All
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Time Edit */}
      <Modal
        open={activeModal === "time"}
        onClose={() => setActiveModal(null)}
        title="Bulk Shift &amp; Working Time Edit"
        size="md"
      >
        <form onSubmit={handleBulkTimeSubmit} className="df-form">
          <div className="df-grid">
            <div className="df-field">
              <label className="df-label">Start Time</label>
              <input
                type="time"
                className="df-input"
                value={bulkTime.startTime}
                onChange={(e) => setBulkTime(p => ({ ...p, startTime: e.target.value }))}
              />
            </div>
            <div className="df-field">
              <label className="df-label">End Time</label>
              <input
                type="time"
                className="df-input"
                value={bulkTime.endTime}
                onChange={(e) => setBulkTime(p => ({ ...p, endTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="df-grid" style={{ marginTop: "16px" }}>
            <div className="df-field">
              <label className="df-label">New End Time</label>
              <input
                type="time"
                className="df-input"
                value={bulkTime.newEndTime}
                onChange={(e) => setBulkTime(p => ({ ...p, newEndTime: e.target.value }))}
              />
            </div>
            <div className="df-field" style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={bulkTime.nightShift}
                  onChange={(e) => setBulkTime(p => ({ ...p, nightShift: e.target.checked }))}
                />
                Night Shift
              </label>
            </div>
          </div>

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Update Times
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Safety Instructions Edit */}
      <Modal
        open={activeModal === "safety"}
        onClose={() => setActiveModal(null)}
        title="Bulk Edit Safety Precautions"
        size="md"
      >
        <form onSubmit={handleBulkSafetySubmit} className="df-form">
          <div className="df-field">
            <label className="df-label">Special Safety Precautions / Conditions</label>
            <textarea
              required
              rows={4}
              placeholder="Enter special instructions or safety details..."
              className="df-textarea"
              value={bulkSafety}
              onChange={(e) => setBulkSafety(e.target.value)}
            />
          </div>

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Save Safety Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Notes */}
      <Modal
        open={activeModal === "notes"}
        onClose={() => setActiveModal(null)}
        title="Add Notes to Selection"
        size="md"
      >
        <form onSubmit={handleBulkNotesSubmit} className="df-form">
          <div className="df-field">
            <label className="df-label">Note Comments</label>
            <textarea
              required
              rows={4}
              placeholder="Add comments to request note feeds..."
              className="df-textarea"
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
            />
          </div>

          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
            <button type="submit" className="df-btn df-btn--submit">
              Save Note
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Copy permit range */}
      <Modal
        open={activeModal === "copy"}
        onClose={() => setActiveModal(null)}
        title="Copy/Clone Request to Consecutive Dates"
        size="md"
      >
        {modalTarget && (
          <form onSubmit={handleCopySubmit} className="df-form">
            <div style={{ marginBottom: "16px" }}>
              <p style={{ color: "#d1d5db" }}>
                Cloning request Permit No: <strong style={{ color: "#fff" }}>{modalTarget.PermitNo}</strong>
              </p>
            </div>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Copy Range (From)</label>
                <input
                  type="date"
                  required
                  className="df-input"
                  value={copyDates.from}
                  onChange={(e) => setCopyDates(p => ({ ...p, from: e.target.value }))}
                />
              </div>
              <div className="df-field">
                <label className="df-label">Copy Range (To)</label>
                <input
                  type="date"
                  required
                  className="df-input"
                  value={copyDates.to}
                  onChange={(e) => setCopyDates(p => ({ ...p, to: e.target.value }))}
                />
              </div>
            </div>

            <div className="df-footer" style={{ marginTop: "24px" }}>
              <button type="button" className="df-btn df-btn--cancel" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="df-btn df-btn--submit">
                Clone Permits
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Logs Details */}
      <Modal
        open={activeModal === "logs"}
        onClose={() => setActiveModal(null)}
        title="Permit Request Logs History"
        size="lg"
      >
        {modalTarget && (
          <div className="logs-history-modal-body">
            <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>Permit Number: <strong style={{ color: "#fff" }}>{modalTarget.PermitNo}</strong></p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0 0" }}>Activity: <strong style={{ color: "#fff" }}>{modalTarget.Activity}</strong></p>
            </div>

            <div className="logs-timeline">
              {logsData.length > 0 ? (
                logsData.map((log, idx) => (
                  <div key={log.id || idx} className="timeline-item">
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <div className="timeline-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ color: "#3b82f6", fontSize: "13px" }}>{log.username || "Operator"}</strong>
                        <small style={{ color: "#9ca3af" }}>{log.createdTime || log.createdAt}</small>
                      </div>
                      <p style={{ color: "#e5e7eb", fontSize: "14px", margin: 0 }}>
                        {log.note || log.message || "Log entry recorded."}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>
                  No historical logs found for this request.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListRequest;