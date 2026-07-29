import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/common/Table/Table";
import { getUserLogs } from "../../services/authService";
import "../styles/pages.css";
import { formatToDenmarkDateTime } from "../../utils/dateUtils";
import { FaSearch } from "react-icons/fa";

const PAGE_LIMIT_DEFAULT = 20;

const CalendarIcon = () => (
  <svg
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "#7a8aab",
      zIndex: 1,
    }}
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

const StatusBadge = ({ status }) => {
  const code = Number(status);
  const isSuccess = code >= 200 && code < 300;
  return (
    <span style={{ color: isSuccess ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
      {status}
    </span>
  );
};

const ACTION_STYLES = (action) => {
  if (!action) return { color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
  const a = action.toUpperCase();
  if (a.includes('FAILURE') || a.includes('ERROR') || a.includes('FAIL'))
    return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
  if (a.includes('DELETED') || a.includes('DELETE'))
    return { color: '#F97316', bg: 'rgba(249,115,22,0.12)' };
  if (a.includes('CREATED') || a.includes('SUCCESS'))
    return { color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
  if (a.includes('UPDATED') || a.includes('UPDATE'))
    return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  if (a.includes('PERMIT') || a.includes('REQUEST'))
    return { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };
  if (a.includes('LOGIN'))
    return { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };
  if (a.includes('OTP'))
    return { color: '#6366F1', bg: 'rgba(99,102,241,0.12)' };
  return { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' };
};

const ActionBadge = ({ action }) => {
  const { color, bg } = ACTION_STYLES(action);
  return (
    <span style={{
      color,
      background: bg,
      fontWeight: 700,
      fontSize: "12px",
      padding: "3px 9px",
      borderRadius: "999px",
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {action || "—"}
    </span>
  );
};


const BodyCell = ({ body }) => {
  let parsed = body;
  try {
    const obj = JSON.parse(body);
    // Mask password field
    if (obj && obj.password) obj.password = "••••••";
    parsed = Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  } catch {
    /* keep raw */
  }
  return <span style={{ whiteSpace: "pre-line", fontSize: "13px" }}>{parsed}</span>;
};

const UserCell = ({ userStr }) => {
  let displayName = userStr;
  try {
    const obj = JSON.parse(userStr);
    displayName = obj.displayName || obj.email || obj.username || userStr;
  } catch {
    /* keep raw */
  }
  return <span style={{ fontSize: "13px" }}>{displayName || "—"}</span>;
};

const formatTimestamp = (ts) => {
  return formatToDenmarkDateTime(ts, "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
};

const LogsReports = () => {
  const [searchUser, setSearchUser]   = useState("");
  const [searchDate, setSearchDate]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit]                   = useState(PAGE_LIMIT_DEFAULT);
  const [logs, setLogs]               = useState([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [isLoading, setIsLoading]     = useState(false);

  const fetchLogs = useCallback(async (page, userQuery = "", dateQuery = "") => {
    setIsLoading(true);
    try {
      const res = await getUserLogs(page, pageLimit, userQuery, dateQuery);
      // Response: { statusCode, data: [...], total, page, limit, totalPages }
      const rows = res?.data ?? [];
      setLogs(rows);
      setTotalPages(res?.totalPages ?? 1);
      setTotalCount(res?.total ?? rows.length);
    } catch (err) {
      console.error("Failed to load logs", err);
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchLogs(currentPage, searchUser, searchDate);
  }, [currentPage, searchUser, searchDate, fetchLogs]);

  const columns = [
    { header: "Action",    accessor: "actionCell"   },
    { header: "URL",       accessor: "urlCell"      },
    { header: "Method",    accessor: "method"       },
    { header: "Status",    accessor: "statusCell"   },
    { header: "User",      accessor: "userCell"     },
    { header: "Body",      accessor: "bodyCell"     },
    { header: "Timestamp", accessor: "timestampFmt" },
  ];

  const tableData = logs.map((item) => ({
    ...item,
    actionCell:   <ActionBadge action={item.action} />,
    urlCell:      <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{item.url || "—"}</span>,
    statusCell:   <StatusBadge status={item.status} />,
    userCell:     <UserCell userStr={item.user} />,
    bodyCell:     <BodyCell body={item.body} />,
    timestampFmt: formatTimestamp(item.timestamp),
  }));

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Logs &amp; Reports</h1>
          <p className="dept-page-subtitle">View all API activity logs and reports</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{totalCount.toLocaleString()} Total</span>
        </div>
      </div>

      <div className="dept-table-card">

        {/* Filters Toolbar: Username Search & Date Filter */}
        <div style={{
          padding: "16px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))"
        }}>
          {/* Username Search Field */}
          <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "380px", display: "flex", alignItems: "center" }}>
            <FaSearch style={{ position: "absolute", left: "14px", color: "#7a8aab", fontSize: "14px", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search by username / email..."
              className="df-input"
              style={{
                width: "100%",
                paddingLeft: "42px",
                paddingRight: searchUser ? "36px" : "14px",
                backgroundColor: "#1a2744",
                border: "1px solid #2e3f66",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                height: "44px",
                outline: "none"
              }}
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchUser && (
              <button
                type="button"
                onClick={() => { setSearchUser(""); setCurrentPage(1); }}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#7a8aab",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "2px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Filter Field */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "300px", display: "flex", alignItems: "center" }}>
            <CalendarIcon />
            <input
              type="date"
              className="df-input"
              style={{
                width: "100%",
                paddingLeft: "42px",
                paddingRight: searchDate ? "36px" : "14px",
                backgroundColor: "#1a2744",
                border: "1px solid #2e3f66",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                height: "44px",
                outline: "none",
                colorScheme: "dark",
              }}
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchDate && (
              <button
                type="button"
                onClick={() => { setSearchDate(""); setCurrentPage(1); }}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#7a8aab",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "2px",
                }}
              >
                ✕
              </button>
            )}
          </div>
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

    </div>
  );
};

export default LogsReports;