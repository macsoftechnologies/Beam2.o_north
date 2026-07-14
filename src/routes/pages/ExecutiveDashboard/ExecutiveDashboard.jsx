import React, { useState, useEffect } from "react";
import { showSuccess } from "../../components/common/Toast/Toast";
import "./ExecutiveDashboard.css";
import groundFloorPlan from "../../assets/images/ground_floor_plan.png";

import { renderPdf } from "../../utils/pdfRenderer";
import { BUILDINGS } from "../../../data/buildings";
import { FLOOR_PDFS } from "../../../data/pdfMapping";

// Mock Data for Overview
const OVERVIEW_METRICS = [
  { id: "total", label: "TOTAL PERMITS", value: 1073, sub: "46 rooms with activity", color: "blue" },
  { id: "clashes", label: "CLASHES", value: 26, sub: "26 HRA, 0 non-HRA", color: "red" },
  { id: "approved", label: "APPROVED", value: 20, sub: "at 46 active rooms", color: "green" },
  { id: "pending", label: "PENDING REVIEW", value: 26, sub: "220 permits on hold", color: "orange" },
];

const PERMIT_STATUSES = [
  { name: "Opened", count: 42, color: "#3b82f6" },
  { name: "Approved", count: 69, color: "#10b981" },
  { name: "Hold", count: 298, color: "#8b5cf6" },
  { name: "Rejected", count: 115, color: "#ef4444" },
  { name: "Draft", count: 11, color: "#6b7280" },
  { name: "Auto-Cancelled", count: 538, color: "#374151" },
];

const FLOOR_CARDS = [
  { name: "Ground Floor", permits: 0, rooms: 0, status: "gray" },
  { name: "1st Floor", permits: 6, rooms: 1, status: "blue" },
  { name: "2nd Floor", permits: 3, rooms: 3, status: "purple" },
  { name: "3rd Floor", permits: 0, rooms: 0, status: "gray" },
  { name: "4th Floor", permits: 0, rooms: 0, status: "gray" },
  { name: "Roof", permits: 5, rooms: 4, status: "blue" },
];

const OVERVIEW_COMPANIES = [
  { name: "Zøllner", code: "ZN", permits: 215, rooms: 3, clashes: 3, color: "#10b981" },
  { name: "Nordkysten", code: "NK", permits: 134, rooms: 7, clashes: 5, color: "#3b82f6" },
  { name: "TSCHERNING", code: "TSC", permits: 128, rooms: 13, clashes: 11, color: "#b45309" },
];

// Mock Data for Floor Layouts (Ground Floor)
const COMPANIES_LIST = [
  { name: "Nordkysten", code: "NK", count: 134, color: "#10b981" },
  { name: "Raklev Smedevirksomhed", code: "RS", count: 13, color: "#1e3a8a" },
  { name: "STS Group", code: "STS", count: 36, color: "#ef4444" },
  { name: "Sweco", code: "SW", count: 26, color: "#881337" },
  { name: "TSCHERNING", code: "TSC", count: 128, color: "#78350f" },
  { name: "Unknown", code: "UNK", count: 2, color: "#581c87" },
  { name: "Wicatec Kirkebjerg", code: "WK", count: 21, color: "#0369a1" },
  { name: "Xylem", code: "XY", count: 19, color: "#0284c7" },
  { name: "Zauner Group", code: "ZG", count: 12, color: "#312e81" },
  { name: "Zeta", code: "ZT", count: 24, color: "#ea580c" },
  { name: "Zøllner", code: "ZN", count: 215, color: "#15803d" },
];

const ROOMS_TO_REVIEW = [
  {
    zone: "ZONE 2",
    companies: ["ZN", "NK", "WK", "STS", "TSC"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 19,
    sub: "8 companies | 336 permits",
  },
  {
    zone: "ZONE 1",
    companies: ["ZN", "NK", "RS", "SW"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 10,
    sub: "6 companies | 173 permits",
  },
  {
    zone: "M3 SOUTH 1",
    companies: ["ZN", "NK", "WK", "RS"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 11,
    sub: "5 companies | 70 permits",
  },
  {
    zone: "TENT 6",
    companies: ["NK", "WK", "STS"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 7,
    sub: "4 companies | 87 permits",
  },
  {
    zone: "TENT 1",
    companies: ["ZN", "TSC", "XY"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 7,
    sub: "4 companies | 113 permits",
  },
  {
    zone: "TENT 8",
    companies: ["ZN", "NK", "ZT"],
    clash: true,
    hra: true,
    onHold: true,
    preOk: 4,
    sub: "4 companies | 68 permits",
  },
];

function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [roomSearch, setRoomSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [isZonesActive, setIsZonesActive] = useState(true);
  const [isIconsActive, setIsIconsActive] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("All room types");
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState("MA Purification");
  const [floorPdfImg, setFloorPdfImg] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (activeTab !== "Overview") {
      const bObj = BUILDINGS.find(
        (b) => b.name.toLowerCase().trim() === selectedBuilding.toLowerCase().trim()
      );
      const bId = bObj ? bObj.id : "";
      const pdfsForBuilding = FLOOR_PDFS[bId];
      let pdfFile = null;

      if (pdfsForBuilding) {
        const tabLower = activeTab.toLowerCase().trim();
        let targetKeys = [];
        if (tabLower.includes("ground")) {
          targetKeys = ["ground", "0", "basement"];
        } else if (tabLower.includes("1st") || tabLower.includes("1")) {
          targetKeys = ["first", "1", "1st"];
        } else if (tabLower.includes("2nd") || tabLower.includes("2")) {
          targetKeys = ["second", "2", "2nd"];
        } else if (tabLower.includes("3rd") || tabLower.includes("3")) {
          targetKeys = ["third", "3", "3rd"];
        } else if (tabLower.includes("4th") || tabLower.includes("4")) {
          targetKeys = ["fourth", "4", "4th"];
        } else if (tabLower.includes("roof")) {
          targetKeys = ["roof", "r"];
        }

        const foundKey = Object.keys(pdfsForBuilding).find((key) => {
          const keyLower = key.toLowerCase().trim();
          return targetKeys.some((tk) => keyLower.includes(tk));
        });

        if (foundKey) {
          pdfFile = pdfsForBuilding[foundKey];
        } else {
          pdfFile = Object.values(pdfsForBuilding)[0];
        }
      }

      if (pdfFile) {
        setLoadingPdf(true);
        renderPdf(pdfFile, 1000).then((canvas) => {
          setFloorPdfImg(canvas.toDataURL());
          setLoadingPdf(false);
        }).catch((err) => {
          console.error("Error rendering PDF:", err);
          setLoadingPdf(false);
        });
      } else {
        setFloorPdfImg(null);
      }
    } else {
      setFloorPdfImg(null);
    }
  }, [selectedBuilding, activeTab]);

  useEffect(() => {
    // When Executive Dashboard loads, automatically close sidebar if open
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.classList.contains("sidebar-closed")) {
      const toggleBtn = document.querySelector(".sidebar-toggle-btn");
      if (toggleBtn) {
        toggleBtn.click();
      }
    }
  }, []);

  // Checkbox Filter States
  const [permitTypes, setPermitTypes] = useState({
    commissioning: true,
    construction: true,
  });

  const [permitStatuses, setPermitStatuses] = useState({
    opened: true,
    approved: true,
    hold: true,
    rejected: false,
    draft: false,
    cancelled: false,
  });

  const handleAutoApprove = () => {
    showSuccess("Successfully auto-approved 18 clear rooms with no active clashes!", "#10b981");
  };

  const handleToggleAllPermitTypes = (val) => {
    setPermitTypes({
      commissioning: val,
      construction: val,
    });
  };

  const handleToggleAllStatuses = (val) => {
    setPermitStatuses({
      opened: val,
      approved: val,
      hold: val,
      rejected: val,
      draft: val,
      cancelled: val,
    });
  };

  const filteredCompanies = COMPANIES_LIST.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="exec-dashboard-container">
      {/* ── TOP PermitHUB NAV STRIP ── */}
      <header className="permithub-navbar">
        <div className="ph-nav-left">
          <span className="ph-brand">
            Permit<span className="ph-hub">HUB</span>
          </span>
          <div className="ph-status-badges">
            <span className="ph-badge-item code-badge">46212.22928240741</span>
            <span className="ph-badge-item clash-badge">
              <span className="dot dot-red" />
              26 clashes
            </span>
            <span className="ph-badge-item remaining-badge">
              <span className="dot dot-yellow" />
              26 remaining
            </span>
            <span className="ph-badge-item resolved-badge">
              <span className="dot dot-green" />
              20 resolved
            </span>
            <span className="ph-badge-item clear-badge">
              <span className="dot dot-blue" />
              385 clear
            </span>
          </div>
        </div>
        <div className="ph-nav-right">
          <button className="ph-icon-btn" title="Toggle Fullscreen">
            <i className="ti ti-maximize" />
          </button>
          <button className="ph-icon-btn" title="View Documentation">
            <i className="ti ti-notebook" />
          </button>
        </div>
      </header>

      {/* ── BUILDING SELECTOR ── */}
      {activeTab !== "Overview" && (
        <div className="exec-building-selector-row">
          <div className="exec-building-selector-group">
            <span className="exec-building-lbl">BUILDING</span>
            <select
              className="exec-building-select"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── FLOOR TABS ── */}
      <div className="exec-tabs-container">
        <div className="exec-tabs-left">
          {[
            "Overview",
            "Ground Floor",
            "1st Floor",
            "2nd Floor",
            "3rd Floor",
            "4th Floor",
            "Roof",
          ].map((tab) => (
            <button
              key={tab}
              className={`exec-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab !== "Overview" && (
          <div className="exec-tabs-right">
            <button
              className={`action-btn-toggle ${isZonesActive ? "active" : ""}`}
              onClick={() => setIsZonesActive((prev) => !prev)}
            >
              <i className={`ti ${isZonesActive ? "ti-square-check" : "ti-square"}`} />
              Zones
            </button>
            <button
              className={`action-btn-toggle ${isIconsActive ? "active" : ""}`}
              onClick={() => setIsIconsActive((prev) => !prev)}
            >
              <i className={`ti ${isIconsActive ? "ti-square-check" : "ti-square"}`} />
              Icons
            </button>
          </div>
        )}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="exec-content-area">
        {activeTab === "Overview" ? (
          /* ════════ OVERVIEW TAB ════════ */
          <div className="overview-tab-view animate-fade-in">
            {/* Metric Cards Row */}
            <div className="overview-metrics-grid">
              {OVERVIEW_METRICS.map((metric) => (
                <div key={metric.id} className={`overview-card metric-card-${metric.color}`}>
                  <div className="card-lbl">{metric.label}</div>
                  <div className="card-val">{metric.value}</div>
                  <div className="card-sub">{metric.sub}</div>
                </div>
              ))}
            </div>

            {/* Permit Statuses & Floor grid Row */}
            <div className="overview-middle-row">
              {/* Permit Statuses Chart & Legend */}
              <div className="overview-card status-panel">
                <h4>PERMIT STATUSES (SSW)</h4>

                {/* Horizontal Progress Bar */}
                <div className="status-progress-bar">
                  {PERMIT_STATUSES.map((status) => {
                    const pct = (status.count / 1073) * 100;
                    return (
                      <div
                        key={status.name}
                        className="status-progress-seg"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: status.color,
                        }}
                        title={`${status.name}: ${status.count} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Legend List */}
                <div className="status-legend-list">
                  {PERMIT_STATUSES.map((status) => (
                    <div key={status.name} className="legend-row">
                      <div className="legend-left">
                        <span
                          className="legend-dot"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="legend-name">{status.name}</span>
                      </div>
                      <span className="legend-count">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floor Permit Cards Grid */}
              <div className="overview-card floors-panel">
                <h4>Floors</h4>
                <div className="floors-mini-grid">
                  {FLOOR_CARDS.map((floor) => (
                    <div key={floor.name} className="floor-mini-card">
                      <div className="floor-card-title">
                        <span className={`status-dot-indicator dot-${floor.status}`} />
                        {floor.name}
                      </div>
                      <div className="floor-card-stats">
                        <span>{floor.permits} permits</span>
                        <span>{floor.rooms} rooms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Companies Table Row */}
            <div className="overview-card companies-panel-card">
              <h4>Companies</h4>
              <div className="companies-table-wrapper">
                <table className="companies-table">
                  <thead>
                    <tr>
                      <th>COMPANY</th>
                      <th>PERMITS</th>
                      <th>ROOMS</th>
                      <th>CLASHES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OVERVIEW_COMPANIES.map((company) => (
                      <tr key={company.name}>
                        <td>
                          <div className="company-name-cell">
                            <span
                              className="company-letter-badge"
                              style={{ backgroundColor: company.color }}
                            >
                              {company.code}
                            </span>
                            {company.name}
                          </div>
                        </td>
                        <td>{company.permits}</td>
                        <td>{company.rooms}</td>
                        <td className="clash-highlight">{company.clashes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ════════ FLOOR LAYOUTS (Ground Floor, etc.) ════════ */
          <div className="floor-layout-view animate-fade-in">

            <div className="three-column-grid">
              {/* ── COLUMN 1: FILTERS (Left) ── */}
              <div className={`panel-col filter-panel ${isLeftOpen ? "panel-open" : "panel-closed"}`}>

                {/* Auto Approve Button inside the Left Panel */}
                {/* <div className="panel-auto-approve-wrapper">
                  <button className="auto-approve-btn" onClick={handleAutoApprove}>
                    <i className="ti ti-check" /> Auto-approve clear rooms
                  </button>
                  <span className="auto-approve-subtext">
                    Approves rooms with no clashes (excludes HRA rooms)
                  </span>
                </div> */}

                {/* Room Search */}
                <div className="filter-group">
                  <label className="filter-lbl">ROOM SEARCH</label>
                  <div className="search-input-wrapper">
                    <i className="ti ti-search search-icon" />
                    <input
                      type="text"
                      className="search-control"
                      placeholder="Search room..."
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Companies Section */}
                <div className="filter-group companies-filter-group">
                  <div className="filter-header-row">
                    <label className="filter-lbl">COMPANIES</label>
                    <div className="toggle-links">
                      <button onClick={() => setCompanySearch("")}>all</button>
                      <span>|</span>
                      <button onClick={() => setCompanySearch("xyz_no_match")}>none</button>
                    </div>
                  </div>
                  <div className="search-input-wrapper">
                    <i className="ti ti-search search-icon" />
                    <input
                      type="text"
                      className="search-control"
                      placeholder="Search company..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                    />
                  </div>
                  <div className="companies-scroll-list">
                    {filteredCompanies.map((company) => (
                      <div key={company.name} className="company-list-item">
                        <div className="company-item-left">
                          <span
                            className="mini-company-badge"
                            style={{ backgroundColor: company.color }}
                          >
                            {company.code}
                          </span>
                          <span className="company-item-name">{company.name}</span>
                        </div>
                        <span className="company-item-count">{company.count}</span>
                      </div>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <div className="no-results">No companies found</div>
                    )}
                  </div>
                </div>

                {/* Permit Type Checkboxes */}
                <div className="filter-group">
                  <div className="filter-header-row">
                    <label className="filter-lbl">PERMIT TYPE</label>
                    <div className="toggle-links">
                      <button onClick={() => handleToggleAllPermitTypes(true)}>all</button>
                      <span>|</span>
                      <button onClick={() => handleToggleAllPermitTypes(false)}>none</button>
                    </div>
                  </div>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitTypes.commissioning}
                        onChange={(e) =>
                          setPermitTypes((prev) => ({
                            ...prev,
                            commissioning: e.target.checked,
                          }))
                        }
                      />
                      Commissioning (2)
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitTypes.construction}
                        onChange={(e) =>
                          setPermitTypes((prev) => ({
                            ...prev,
                            construction: e.target.checked,
                          }))
                        }
                      />
                      Construction (1067)
                    </label>
                  </div>
                </div>

                {/* Permit Status Checkboxes */}
                <div className="filter-group">
                  <div className="filter-header-row">
                    <label className="filter-lbl">PERMIT STATUS</label>
                    <div className="toggle-links">
                      <button onClick={() => handleToggleAllStatuses(true)}>all</button>
                      <span>|</span>
                      <button onClick={() => handleToggleAllStatuses(false)}>none</button>
                    </div>
                  </div>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitStatuses.opened}
                        onChange={(e) =>
                          setPermitStatuses((prev) => ({
                            ...prev,
                            opened: e.target.checked,
                          }))
                        }
                      />
                      <span className="status-dot dot-blue" style={{ marginRight: 6 }} />
                      Opened (42)
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitStatuses.approved}
                        onChange={(e) =>
                          setPermitStatuses((prev) => ({
                            ...prev,
                            approved: e.target.checked,
                          }))
                        }
                      />
                      <span className="status-dot dot-green" style={{ marginRight: 6 }} />
                      Approved (69)
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitStatuses.hold}
                        onChange={(e) =>
                          setPermitStatuses((prev) => ({
                            ...prev,
                            hold: e.target.checked,
                          }))
                        }
                      />
                      <span className="status-dot dot-purple" style={{ marginRight: 6 }} />
                      Hold (298)
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={permitStatuses.rejected}
                        onChange={(e) =>
                          setPermitStatuses((prev) => ({
                            ...prev,
                            rejected: e.target.checked,
                          }))
                        }
                      />
                      <span className="status-dot dot-red" style={{ marginRight: 6 }} />
                      Rejected (115)
                    </label>
                  </div>
                </div>

              </div>

              {/* ── COLUMN 2: MAP VIEWER (Center) ── */}
              <div className="panel-col map-viewer-panel">
                {/* Left panel collapse tab */}
                <button
                  className={`panel-toggle-tab toggle-tab-left ${isLeftOpen ? "open" : "closed"}`}
                  onClick={() => setIsLeftOpen(!isLeftOpen)}
                  title={isLeftOpen ? "Collapse Left Panel" : "Expand Left Panel"}
                >
                  <i className={`ti ${isLeftOpen ? "ti-chevron-left" : "ti-chevron-right"}`} />
                </button>

                {/* Right panel collapse tab */}
                <button
                  className={`panel-toggle-tab toggle-tab-right ${isRightOpen ? "open" : "closed"}`}
                  onClick={() => setIsRightOpen(!isRightOpen)}
                  title={isRightOpen ? "Collapse Right Panel" : "Expand Right Panel"}
                >
                  <i className={`ti ${isRightOpen ? "ti-chevron-right" : "ti-chevron-left"}`} />
                </button>

                <div className="map-view-header">
                  <div className="map-title-badge">{activeTab === "Ground Floor" ? "JG- Ground floor" : `JG- ${activeTab}`}</div>
                </div>

                <div className="map-image-wrapper">
                  {loadingPdf ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%", color: "#94a3b8" }}>
                      <span>Loading Floor Plan PDF...</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={floorPdfImg || groundFloorPlan}
                        alt={`${activeTab} CAD drawing`}
                        className="static-cad-image"
                      />

                      {/* Overlay mock elements to make floor plan look alive */}
                      {isZonesActive && (
                        <div className="map-mock-zones-overlay">
                          <div className="mock-zone-label zone-label-1" style={{ top: "35%", left: "20%" }}>ZONE 2</div>
                          <div className="mock-zone-label zone-label-2" style={{ top: "40%", left: "60%" }}>ZONE 1</div>
                          <div className="mock-zone-label zone-label-3" style={{ top: "70%", left: "45%" }}>M3 SOUTH 1</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Map Legend Footer */}
                <div className="map-legend-footer">
                  <div className="legend-indicator-item">
                    <span className="legend-indicator-dot dot-indicator-ok" />
                    OK
                  </div>
                  <div className="legend-indicator-item">
                    <span className="legend-indicator-dot dot-indicator-nowork" />
                    No work
                  </div>
                  <div className="legend-indicator-item">
                    <span className="legend-indicator-dot dot-indicator-clash" />
                    Clash
                  </div>
                </div>
              </div>

              {/* ── COLUMN 3: ROOMS TO REVIEW (Right) ── */}
              <div className={`panel-col review-panel ${isRightOpen ? "panel-open" : "panel-closed"}`}>


                {/* Room Type Selector */}
                <div className="filter-group room-type-filter-group">
                  <label className="filter-lbl">Filter by room type</label>
                  <select
                    className="room-type-select"
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                  >
                    <option>All room types</option>
                    <option>Electrical Rooms</option>
                    <option>Mechanical Rooms</option>
                    <option>Corridors</option>
                    <option>Offices</option>
                  </select>
                </div>

                <div className="review-list-header">
                  <h5>ROOMS TO REVIEW</h5>
                </div>

                <div className="review-scroll-container">
                  {ROOMS_TO_REVIEW.map((item) => (
                    <div key={item.zone} className="review-card-item">
                      <div className="review-card-top-row">
                        <span className="review-zone-name">{item.zone}</span>
                        {/* Avatar Row */}
                        <div className="review-avatar-row">
                          {item.companies.slice(0, 3).map((c, i) => (
                            <span
                              key={c}
                              className="mini-avatar"
                              style={{
                                zIndex: 10 - i,
                                backgroundColor: i === 0 ? "#15803d" : i === 1 ? "#3b82f6" : "#b45309",
                              }}
                            >
                              {c}
                            </span>
                          ))}
                          {item.companies.length > 3 && (
                            <span className="mini-avatar avatar-plus">+{item.companies.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* Status Pills */}
                      <div className="review-pills-row">
                        {item.clash && <span className="pill-badge pill-red">CLASH</span>}
                        {item.hra && <span className="pill-badge pill-darkred">HRA</span>}
                        {item.onHold && <span className="pill-badge pill-purple">ON HOLD</span>}
                        {item.preOk > 0 && (
                          <span className="pill-badge pill-green">{item.preOk} PRE-OK</span>
                        )}
                      </div>

                      <div className="review-card-footer">
                        <span>{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutiveDashboard;
