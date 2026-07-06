import React, { useState, useEffect, useMemo, useRef } from "react";
import Table from "../../components/common/Table/Table";
import {
  getContractors,
  getBuildings,
  getFloors,
  getZones,
  getPlans
} from "../../services/authService";
import { searchRequests } from "../../services/requestService";
import { buildingDataWithIds } from "../../data/buildingDataWithIds";
import "../styles/pages.css";
import "../../forms/styles/forms.css";

// ─── Import HRA Icons ───────────────────────────────────────────────────────
import HotWorksLogo from "../../assets/images/logos/HotWorks.png";
import ElectricalSystemsLogo from "../../assets/images/logos/ElectricalSystems.png";
import SubstanceChemicalLogo from "../../assets/images/logos/substanceChemical.png";
import TestingEquipmentLogo from "../../assets/images/logos/testingequipment.png";
import WorkingAtHightLogo from "../../assets/images/logos/WorkingAtHight.png";
import ConfinedSpaceLogo from "../../assets/images/logos/ConfinedSpace.png";
import ExcavationWorksLogo from "../../assets/images/logos/ExcavationWorks.png";
import CranesLiftingLogo from "../../assets/images/logos/Craneslifting.png";
import ElectricalWorksLogo from "../../assets/images/logos/electrical_works.png";
import MechanicalWorksLogo from "../../assets/images/logos/mechanical1.png";

// ─── Static options ───────────────────────────────────────────────────────────
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

const STATUS_OPTIONS = [
  "Hold",
  "Draft",
  "Approved",
  "Rejected",
  "Opened",
  "Closed",
  "Cancelled",
  "Pre-Approved",
  "Auto-Cancel"
];

const HRA_LIST = [
  { key: "Hot_work", label: "Hot Work", image: HotWorksLogo },
  { key: "working_on_electrical_system", label: "Electrical Systems", image: ElectricalSystemsLogo },
  { key: "working_hazardious_substen", label: "Hazardous Substances", image: SubstanceChemicalLogo },
  { key: "pressure_tesing_of_equipment", label: "Testing Equipment", image: TestingEquipmentLogo },
  { key: "working_at_height", label: "Working at Height", image: WorkingAtHightLogo },
  { key: "working_confined_spaces", label: "Confined Space", image: ConfinedSpaceLogo },
  { key: "work_in_atex_area", label: "ATEX Area", image: null },
  { key: "securing_facilities", label: "Securing Facilities", image: null },
  { key: "excavation_works", label: "Excavation Works", image: ExcavationWorksLogo },
  { key: "using_cranes_or_lifting", label: "Cranes & Lifting", image: CranesLiftingLogo },
  { key: "power_on", label: "Electrical Works", image: ElectricalWorksLogo },
  { key: "pressurization", label: "Mechanical Works", image: MechanicalWorksLogo }
];

const INITIAL_FILTERS = {
  reportType: "1", // 1 = Daily Report, 2 = Weekly Report
  date: "",
  year: "",
  weekno: "",
  subContractor: "",
  building: [],
  workingDateFrom: "",
  workingDateTo: "",
  startTime: "",
  endTime: "",
  level: [],
  area: [],
  permitType: "",
  permitUnder: "",
  nightShift: false,
  newWorkDate: "",
  newEndTime: "",
  status: [],
  hras: []
};

// ─── Custom Multiple Select Dropdown Component ──────────────────────────────
const MultiSelectDropdown = ({
  placeholder,
  options = [],
  selectedValues = [],
  onChange = () => {},
  hasNone = false,
  isHra = false
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

  const handleToggle = () => setIsOpen(!isOpen);

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
          cursor: "pointer",
          userSelect: "none",
          paddingRight: "14px",
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
            // Support grouped zones
            if (opt.zones) {
              return (
                <div key={idx}>
                  <div style={{
                    padding: "8px 16px 4px 16px",
                    color: "var(--text-muted, #9ca3af)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderTop: idx > 0 ? "1px solid var(--border-color, #374151)" : "none"
                  }}>
                    {opt.floorName}
                  </div>
                  {opt.zones.map((z, zIdx) => {
                    const isChecked = selectedValues.includes(z);
                    return (
                      <label
                        key={zIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 24px",
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
                          onChange={(e) => handleCheckboxChange(z, e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                            accentColor: "var(--accent, #00e5a0)",
                            borderRadius: "4px"
                          }}
                        />
                        <span>{z}</span>
                      </label>
                    );
                  })}
                </div>
              );
            }

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
                {isHra && opt.image && (
                  <img
                    src={opt.image}
                    alt={displayLabel}
                    style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
                  />
                )}
                <span>{displayLabel}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Status Badge Component ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  let color = "#3b82f6";
  let bg = "rgba(59, 130, 246, 0.1)";
  
  const s = String(status || "").toLowerCase();
  if (s === "approved") {
    color = "#10b981";
    bg = "rgba(16, 185, 129, 0.1)";
  } else if (s === "hold" || s === "draft") {
    color = "#f59e0b";
    bg = "rgba(245, 158, 11, 0.1)";
  } else if (s === "rejected" || s === "cancelled" || s === "auto-cancel") {
    color = "#ef4444";
    bg = "rgba(239, 68, 68, 0.1)";
  } else if (s === "pre-approved") {
    color = "#8b5cf6";
    bg = "rgba(139, 92, 246, 0.1)";
  } else if (s === "opened") {
    color = "#06b6d4";
    bg = "rgba(6, 182, 212, 0.1)";
  } else if (s === "closed") {
    color = "#6b7280";
    bg = "rgba(107, 114, 128, 0.1)";
  }
  
  return (
    <span style={{
      color,
      backgroundColor: bg,
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
};

const Reports = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [tableData, setTableData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 10;

  // Dropdown options
  const [contractors, setContractors] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [weeksList, setWeeksList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // ─── Fetch Selector Lists ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchSelectors = async () => {
      try {
        const [subRes, buildRes, floorRes, zoneRes] = await Promise.all([
          getContractors(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        setContractors(subRes?.data?.rows ?? subRes?.data ?? subRes ?? []);
        setBuildingsList(buildRes?.data ?? []);
        setFloorsList(floorRes?.data ?? []);
        setZonesList(zoneRes?.data ?? []);
      } catch (err) {
        console.error("Failed to load selectors lists", err);
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    fetchSelectors();
  }, []);

  // ─── Filtered Levels and Areas derived from buildingDataWithIds ────────────
  const buildingsOptions = useMemo(() => {
    const uniqueIds = [...new Set(buildingDataWithIds.map(b => String(b.buildingId)))];
    return uniqueIds.map(id => {
      const apiBuild = buildingsList.find(b => String(b.build_id) === id);
      return {
        build_id: id,
        building_name: apiBuild ? apiBuild.building_name : `Building ${id}`
      };
    });
  }, [buildingsList]);

  const allFloors = useMemo(() => {
    const floors = [];
    buildingDataWithIds.forEach(building => {
      floors.push({
        buildingId: String(building.buildingId),
        floorName: building.planType
      });
    });
    return floors;
  }, []);

  const allRooms = useMemo(() => {
    const rooms = [];
    buildingDataWithIds.forEach(building => {
      building.zoneList?.forEach(zone => {
        rooms.push({
          buildingId: String(building.buildingId),
          planType: building.planType,
          floorName: zone.floorName,
          zones: zone.zoneSubList?.map(sub => sub.value) || []
        });
      });
    });
    return rooms;
  }, []);

  const filteredFloors = useMemo(() => {
    if (filters.building.length === 0) {
      return [...new Set(allFloors.map(f => f.floorName))];
    }
    return [
      ...new Set(
        allFloors
          .filter(f => filters.building.includes(f.buildingId))
          .map(f => f.floorName)
      )
    ];
  }, [filters.building, allFloors]);

  const filteredRooms = useMemo(() => {
    return allRooms.filter(room => {
      const buildingMatch = filters.building.length === 0 || filters.building.includes(room.buildingId);
      const levelMatch = filters.level.length === 0 || filters.level.includes(room.planType);
      return buildingMatch && levelMatch;
    });
  }, [filters.building, filters.level, allRooms]);

  // ─── Change Handlers ────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "reportType") {
        next.date = "";
        next.year = "";
        next.weekno = "";
      }
      return next;
    });
  };

  const handleYearChange = (yearVal) => {
    handleChange("year", yearVal);
    handleChange("weekno", "");
    if (!yearVal) {
      setWeeksList([]);
      return;
    }
    
    const weeks = [];
    const dec28 = new Date(Number(yearVal), 11, 28);
    const day = dec28.getDay();
    const isLeap = (Number(yearVal) % 4 === 0 && Number(yearVal) % 100 !== 0) || (Number(yearVal) % 400 === 0);
    const totalWeeks = (day === 4 || (isLeap && day === 3)) ? 53 : 52;

    for (let w = 1; w <= totalWeeks; w++) {
      const simple = new Date(Number(yearVal), 0, 1 + (w - 1) * 7);
      const dow = simple.getDay();
      const ISOweekStart = new Date(simple);
      const startDayOffset = dow === 0 ? -6 : 1 - dow;
      ISOweekStart.setDate(simple.getDate() + startDayOffset);
      
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      
      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${dt}`;
      };
      
      weeks.push(`${formatDate(ISOweekStart)}  -  ${formatDate(ISOweekEnd)}  -  ${w}`);
    }
    setWeeksList(weeks);
  };

  // ─── Search API Query ──────────────────────────────────────────────────────
  const handleShow = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchPayload = {};

      // Unified search payload parameters (with fallback/compatible keys)
      searchPayload.Site_Id = 5;
      searchPayload.Page = 1;
      searchPayload.End = 5000;
      searchPayload.Building_Id = filters.building.length > 0 ? Number(filters.building[0]) : null;
      searchPayload.Sub_Contractor_Id = filters.subContractor ? Number(filters.subContractor) : null;
      searchPayload.Room_Type = filters.level.length > 0 ? filters.level.join(",") : "";
      searchPayload.area = filters.area.length > 0 ? filters.area.join("|") : "";
      searchPayload.permit_type = filters.permitType || "";
      searchPayload.permit_under = filters.permitUnder || "";
      searchPayload.night_shift = filters.nightShift ? "1" : "0";
      
      const targetDate = (filters.reportType === "1" && filters.date) ? filters.date : "";
      searchPayload.fromDate = targetDate || filters.workingDateFrom || "";
      searchPayload.toDate = targetDate || filters.workingDateTo || "";
      
      // Suffix start/end time with :00 if present
      searchPayload.Start_Time = filters.startTime ? (filters.startTime.length === 5 ? `${filters.startTime}:00` : filters.startTime) : "";
      searchPayload.End_Time = filters.endTime ? (filters.endTime.length === 5 ? `${filters.endTime}:00` : filters.endTime) : "";

      // Format status
      const statusArray = Array.isArray(filters.status) ? filters.status : [];
      const formattedStatus = statusArray
        .filter(val => val !== null && val !== undefined && val !== "")
        .map(val => `'${val}'`)
        .join(",");
      searchPayload.Request_status = formattedStatus || "";

      // HRA calculations
      const hrasList = Array.isArray(filters.hras) ? filters.hras : [];
      const hasNone = hrasList.includes("none");
      if (hasNone) {
        searchPayload.hras = 0;
      } else if (hrasList.length > 0) {
        searchPayload.hras = 1;
        hrasList.forEach(hraKey => {
          searchPayload[hraKey] = 1;
        });
      }

      // Keep only allowed custom extension fields that don't trigger validation errors
      searchPayload.new_date = filters.newWorkDate || "";
      searchPayload.new_end_time = filters.newEndTime || "";

      // Call Unified Search API
      const res = await searchRequests(searchPayload);
      
      let rows = [];
      if (res && res.data) {
        if (Array.isArray(res.data) && res.data.length > 0 && res.data[0] && Array.isArray(res.data[0].data)) {
          rows = res.data[0].data;
        } else if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (res.data.rows) {
          rows = res.data.rows;
        }
      } else if (Array.isArray(res)) {
        if (res.length > 0 && res[0] && Array.isArray(res[0].data)) {
          rows = res[0].data;
        } else {
          rows = res;
        }
      }
      
      setTableData(rows);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load reports data", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setTableData([]);
    setHasSearched(false);
    setWeeksList([]);
  };

  // ─── Listen to Enter Key ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        const isFocusableSelect = document.querySelector("select:focus");
        if (isFocusableSelect) return;

        const activeTag = document.activeElement?.tagName?.toUpperCase();
        if (activeTag === "BUTTON" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;

        event.preventDefault();
        handleShow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filters]);

  // ─── CSV Export Logic ──────────────────────────────────────────────────────
  const handleDownload = () => {
    if (tableData.length === 0) {
      alert("No data available to export.");
      return;
    }
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const printHRAS = (row) => {
      const hrasValues = [];
      const keys = [
        "Hot_work", "working_on_electrical_system", "working_hazardious_substen",
        "pressure_tesing_of_equipment", "working_at_height", "working_confined_spaces",
        "work_in_atex_area", "securing_facilities", "excavation_works", "using_cranes_or_lifting",
        "power_on", "pressurization"
      ];
      keys.forEach(key => {
        if (row[key] == 1 || row[key] === "1" || row[key] === true) {
          hrasValues.push(key.replace(/_/g, ' '));
        }
      });
      return hrasValues.join(", ");
    };

    const formatNotes = (notes) => {
      if (!notes) return "";
      if (typeof notes === "string") return notes.replace(/[\n\r,]+/g, " ");
      if (Array.isArray(notes)) {
        return notes
          .map(n => `${n.username || n.Username || ""}: ${n.note || n.Note || ""}`)
          .join("; ")
          .replace(/[\n\r,]+/g, " ");
      }
      return "";
    };

    const findNewDay = (row) => {
      if (row.new_date && row.new_date !== "00-00-0000" && row.new_date !== "0000-00-00") {
        const newDate = new Date(row.new_date);
        if (!isNaN(newDate.getTime())) {
          return daysNames[newDate.getDay()];
        }
      }
      return "";
    };

    const headers = [
      "PermitNo", "PermitUnder", "PermitType", "ContractorName", "Sub_Contractor_Name",
      "Building_Name", "Level", "Room_Nos", "Activity", "description_of_activity",
      "Rams_Number", "HRAs", "Auth", "Comment", "Start_Time", "End_Time",
      "Night_Shift", "New_End_Time", "Request_status", "Notes", "Working_Date",
      "Day", "New_Date", "New_Day", "CoNM_initials", "CoMM_initials", "Opened_By",
      "Reject_Reason", "Cancel_Reason"
    ];

    const rows = tableData.map(x => {
      const dayIndex = x.Working_Date ? new Date(x.Working_Date).getDay() : null;
      const dayName = (dayIndex !== null && !isNaN(dayIndex)) ? daysNames[dayIndex] : "";
      
      const rowData = {
        PermitNo: x.PermitNo || "",
        PermitUnder: x.permit_under || 'Construction',
        PermitType: x.permit_type || 'Construction',
        ContractorName: x.subContractorName || "",
        Sub_Contractor_Name: x.new_sub_contractor || "",
        Building_Name: x.building_name || "",
        Level: x.Room_Type || "",
        Room_Nos: x.Room_Nos || "",
        Activity: x.Activity || "",
        description_of_activity: x.description_of_activity || "",
        Rams_Number: x.rams_number || "",
        HRAs: printHRAS(x),
        Auth: "",
        Comment: "",
        Start_Time: x.Start_Time || "",
        End_Time: x.End_Time || "",
        Night_Shift: x.night_shift == 1 ? 'Yes' : 'No',
        New_End_Time: x.new_end_time || "",
        Request_status: x.Request_status || "",
        Notes: formatNotes(x.Notes || x.note),
        Working_Date: x.Working_Date || "",
        Day: dayName,
        New_Date: x.new_date || "",
        New_Day: findNewDay(x),
        CoNM_initials: x.ConM_initials || "",
        CoMM_initials: x.CoMM_initials || "",
        Opened_By: x.ConM_initials1 || "",
        Reject_Reason: x.reject_reason || "",
        Cancel_Reason: x.cancel_reason || ""
      };

      return headers.map(header => {
        const val = String(rowData[header] ?? "").replace(/"/g, '""');
        return `"${val}"`;
      }).join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ACTIVITY_PERMITS_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export.");
      return;
    }
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const printHRAS = (row) => {
      const hrasValues = [];
      const keys = [
        "Hot_work", "working_on_electrical_system", "working_hazardious_substen",
        "pressure_tesing_of_equipment", "working_at_height", "working_confined_spaces",
        "work_in_atex_area", "securing_facilities", "excavation_works", "using_cranes_or_lifting",
        "power_on", "pressurization"
      ];
      keys.forEach(key => {
        if (row[key] == 1 || row[key] === "1" || row[key] === true) {
          hrasValues.push(key.replace(/_/g, ' '));
        }
      });
      return hrasValues.join(", ");
    };

    const formatNotes = (notes) => {
      if (!notes) return "";
      if (typeof notes === "string") return notes.replace(/[\n\r,]+/g, " ");
      if (Array.isArray(notes)) {
        return notes
          .map(n => `${n.username || n.Username || ""}: ${n.note || n.Note || ""}`)
          .join("; ")
          .replace(/[\n\r,]+/g, " ");
      }
      return "";
    };

    const findNewDay = (row) => {
      if (row.new_date && row.new_date !== "00-00-0000" && row.new_date !== "0000-00-00") {
        const newDate = new Date(row.new_date);
        if (!isNaN(newDate.getTime())) {
          return daysNames[newDate.getDay()];
        }
      }
      return "";
    };

    const headers = [
      "PermitNo", "PermitUnder", "PermitType", "ContractorName", "Sub_Contractor_Name",
      "Building_Name", "Level", "Room_Nos", "Activity", "description_of_activity",
      "Rams_Number", "HRAs", "Auth", "Comment", "Start_Time", "End_Time",
      "Night_Shift", "New_End_Time", "Request_status", "Notes", "Working_Date",
      "Day", "New_Date", "New_Day", "CoNM_initials", "CoMM_initials", "Opened_By",
      "Reject_Reason", "Cancel_Reason"
    ];

    const rowsData = tableData.map(x => {
      const dayIndex = x.Working_Date ? new Date(x.Working_Date).getDay() : null;
      const dayName = (dayIndex !== null && !isNaN(dayIndex)) ? daysNames[dayIndex] : "";
      
      return {
        PermitNo: x.PermitNo || "",
        PermitUnder: x.permit_under || 'Construction',
        PermitType: x.permit_type || 'Construction',
        ContractorName: x.subContractorName || "",
        Sub_Contractor_Name: x.new_sub_contractor || "",
        Building_Name: x.building_name || "",
        Level: x.Room_Type || "",
        Room_Nos: x.Room_Nos || "",
        Activity: x.Activity || "",
        description_of_activity: x.description_of_activity || "",
        Rams_Number: x.rams_number || "",
        HRAs: printHRAS(x),
        Auth: "",
        Comment: "",
        Start_Time: x.Start_Time || "",
        End_Time: x.End_Time || "",
        Night_Shift: x.night_shift == 1 ? 'Yes' : 'No',
        New_End_Time: x.new_end_time || "",
        Request_status: x.Request_status || "",
        Notes: formatNotes(x.Notes || x.note),
        Working_Date: x.Working_Date || "",
        Day: dayName,
        New_Date: x.new_date || "",
        New_Day: findNewDay(x),
        CoNM_initials: x.ConM_initials || "",
        CoMM_initials: x.CoMM_initials || "",
        Opened_By: x.ConM_initials1 || "",
        Reject_Reason: x.reject_reason || "",
        Cancel_Reason: x.cancel_reason || ""
      };
    });

    let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
    html += '<head><meta charset="UTF-8"></head><body><table border="1">';
    html += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rowsData.forEach(row => {
      html += '<tr>' + headers.map(h => `<td>${String(row[h]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + '</tr>';
    });
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ACTIVITY_PERMITS_REPORT_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Table Configuration ───────────────────────────────────────────────────
  const columns = [
    { header: "Permit number", accessor: "PermitNo" },
    { header: "Activity", accessor: "Activity" },
    { header: "Contractor", accessor: "subContractorName" },
    { header: "Sub-Contractor", accessor: "new_sub_contractor" },
    { header: "Level", accessor: "Room_Type" },
    { header: "Building Name", accessor: "building_name" },
    { header: "Area", accessor: "Room_Nos" },
    { header: "Working Date", accessor: "Working_Date" },
    { header: "Time", accessor: "timeCell" },
    { header: "Night Shift", accessor: "nightShiftCell" },
    { header: "New Date", accessor: "newDateCell" },
    { header: "New End Time", accessor: "newEndTime" },
    { header: "Status", accessor: "statusCell" }
  ];

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_LIMIT));
  const startIndex = (currentPage - 1) * PAGE_LIMIT;
  const paginatedData = tableData.slice(startIndex, startIndex + PAGE_LIMIT);

  const formattedTableData = paginatedData.map(item => {
    const isValidDate = (d) => {
      if (!d || d === "0000-00-00" || d === "00-00-0000") return false;
      const parsed = Date.parse(d);
      return !isNaN(parsed);
    };

    const formatMediumDate = (d) => {
      if (!isValidDate(d)) return "N/A";
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    return {
      ...item,
      Working_Date: formatMediumDate(item.Working_Date),
      timeCell: `${item.Start_Time || ""} - ${item.End_Time || ""}`,
      nightShiftCell: item.night_shift == 1 ? "Yes" : "No",
      newDateCell: formatMediumDate(item.new_date),
      newEndTime: item.new_end_time || "",
      statusCell: <StatusBadge status={item.Request_status} />
    };
  });

  return (
    <div className="dept-page">
      {/* Page Header */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Show Reports</h1>
          <p className="dept-page-subtitle">Filter and generate permit reports dynamically</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "24px" }}>
        <div className="df-form" style={{ padding: "24px" }}>
          <div className="df-grid">
            
            {/* Row 1: Report Type | Date */}
            <div className="df-field">
              <label className="df-label">Report Type</label>
              <select
                className="df-select"
                value={filters.reportType}
                onChange={(e) => handleChange("reportType", e.target.value)}
              >
                <option value="1">Daily Report</option>
                <option value="2">Weekly Report</option>
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Date</label>
              <input
                type="date"
                className="df-input"
                disabled={filters.reportType === "2"}
                value={filters.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>

            {/* Row 2: Year | Week */}
            <div className="df-field">
              <label className="df-label">Year</label>
              <select
                className="df-select"
                disabled={filters.reportType === "1"}
                value={filters.year}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                <option value="">Select Year</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Week</label>
              <select
                className="df-select"
                disabled={filters.reportType === "1" || !filters.year}
                value={filters.weekno}
                onChange={(e) => handleChange("weekno", e.target.value)}
              >
                <option value="">Select Week</option>
                {weeksList.map((wk, idx) => (
                  <option key={idx} value={wk}>{wk}</option>
                ))}
              </select>
            </div>

            {/* Row 3: Contractor | Building */}
            <div className="df-field">
              <label className="df-label">Contractor</label>
              <select
                className="df-select"
                value={filters.subContractor}
                onChange={(e) => handleChange("subContractor", e.target.value)}
              >
                <option value="">Select Contractor</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.subContractorName}</option>
                ))}
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Building (Multiple)</label>
              <MultiSelectDropdown
                placeholder="Select Buildings"
                options={buildingsOptions}
                selectedValues={filters.building}
                onChange={(vals) => {
                  setFilters(prev => ({ ...prev, building: vals, level: [], area: [] }));
                }}
              />
            </div>

            {/* Row 4: Working Date (from) | Working Date (to) */}
            <div className="df-field">
              <label className="df-label">Working Date (from)</label>
              <input
                type="date"
                className="df-input"
                value={filters.workingDateFrom}
                onChange={(e) => handleChange("workingDateFrom", e.target.value)}
              />
            </div>

            <div className="df-field">
              <label className="df-label">Working Date (to)</label>
              <input
                type="date"
                className="df-input"
                value={filters.workingDateTo}
                onChange={(e) => handleChange("workingDateTo", e.target.value)}
              />
            </div>

            {/* Row 5: Start Time | End Time & Night Shift (3 columns nested in full-width wrapper) */}
            <div className="df-field--full" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px" }}>
              <div className="df-field">
                <label className="df-label">Start Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={filters.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                />
              </div>

              <div className="df-field">
                <label className="df-label">End Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={filters.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                />
              </div>

              <div className="df-field" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "46px", paddingLeft: "12px", border: "1.5px solid var(--border-color, #374151)", borderRadius: "12px", backgroundColor: "var(--bg-card, #111827)" }}>
                  <input
                    type="checkbox"
                    id="nightShiftCheckbox"
                    checked={filters.nightShift}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFilters(prev => ({
                        ...prev,
                        nightShift: checked,
                        newWorkDate: checked ? prev.newWorkDate : "",
                        newEndTime: checked ? prev.newEndTime : ""
                      }));
                    }}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent, #00e5a0)" }}
                  />
                  <label htmlFor="nightShiftCheckbox" className="df-label" style={{ margin: 0, cursor: "pointer", textTransform: "none", fontSize: "14px", fontWeight: "normal", color: "var(--text-main, #f9fafb)" }}>
                    Night shift? Yes
                  </label>
                </div>
              </div>
            </div>

            {/* Conditional Night Shift Fields */}
            {filters.nightShift && (
              <>
                <div className="df-field">
                  <label className="df-label">New Date</label>
                  <input
                    type="date"
                    className="df-input"
                    value={filters.newWorkDate}
                    onChange={(e) => handleChange("newWorkDate", e.target.value)}
                  />
                </div>
                <div className="df-field">
                  <label className="df-label">New End Time</label>
                  <input
                    type="time"
                    className="df-input"
                    value={filters.newEndTime}
                    onChange={(e) => handleChange("newEndTime", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Row 6: Level | Area */}
            <div className="df-field">
              <label className="df-label">Level (Multiple)</label>
              <MultiSelectDropdown
                placeholder="Select Levels"
                options={filteredFloors}
                selectedValues={filters.level}
                onChange={(vals) => {
                  setFilters(prev => ({ ...prev, level: vals, area: [] }));
                }}
              />
            </div>

            <div className="df-field">
              <label className="df-label">Area (Multiple)</label>
              <MultiSelectDropdown
                placeholder="Select Areas"
                options={filteredRooms}
                selectedValues={filters.area}
                onChange={(vals) => handleChange("area", vals)}
              />
            </div>

            {/* Row 7: Permit Type | Permit Under */}
            <div className="df-field">
              <label className="df-label">Permit Type</label>
              <select
                className="df-select"
                value={filters.permitType}
                onChange={(e) => handleChange("permitType", e.target.value)}
              >
                <option value="">Select Permit Type</option>
                <option value="Construction">Construction</option>
                <option value="Commissioning">Commissioning</option>
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Permit Under</label>
              <select
                className="df-select"
                value={filters.permitUnder}
                onChange={(e) => handleChange("permitUnder", e.target.value)}
              >
                <option value="">Select Permit Under</option>
                <option value="Construction">Construction</option>
                <option value="Commissioning">Commissioning</option>
              </select>
            </div>

            {/* Row 8: Status | HRA'S */}
            <div className="df-field">
              <label className="df-label">Status (Multiple)</label>
              <MultiSelectDropdown
                placeholder="Select Statuses"
                options={STATUS_OPTIONS}
                selectedValues={filters.status}
                onChange={(vals) => handleChange("status", vals)}
              />
            </div>

            <div className="df-field">
              <label className="df-label">HRA Checklists (Multiple)</label>
              <MultiSelectDropdown
                placeholder="Select HRA Checklists"
                options={HRA_LIST}
                selectedValues={filters.hras}
                onChange={(vals) => handleChange("hras", vals)}
                hasNone={true}
                isHra={true}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="df-footer" style={{ justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              type="button"
              className="df-btn df-btn--cancel"
              onClick={handleReset}
              disabled={isSearching}
            >
              Reset
            </button>
            <button
              type="button"
              className="df-btn df-btn--submit"
              onClick={handleShow}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Show"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table Card */}
      <div className="dept-table-card">
        <div className="dept-page-header" style={{ padding: "12px 16px", marginBottom: 0 }}>
          <div className="dept-page-header__left">
            <span className="dept-count-badge">{tableData.length} Total</span>
          </div>
          <div className="dept-page-header__right" style={{ display: "flex", gap: "12px" }}>
            <button
              className="dept-add-btn"
              onClick={handleDownload}
              disabled={tableData.length === 0}
            >
              <span className="dept-add-btn__icon">⬇</span>
              Download CSV
            </button>
            <button
              className="dept-add-btn"
              onClick={handleDownloadExcel}
              disabled={tableData.length === 0}
              style={{ backgroundColor: "#10b981", color: "#fff" }}
            >
              <span className="dept-add-btn__icon">⬇</span>
              Download Excel
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          data={formattedTableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoadingSelectors || isSearching}
        />
      </div>
    </div>
  );
};

export default Reports;