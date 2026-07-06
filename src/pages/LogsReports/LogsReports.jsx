import React, { useState } from "react";
import Table from "../../components/common/Table/Table";
import "../styles/pages.css";

const STATIC_LOGS = [
  { logId: 1, action: "API_SUCCESS", method: "POST", url: "team/teamlistsubId.php",  status: 200, user: "maoh@wk.dk",                            body: "subcontId: 53",                               timestamp: "Jun 4, 2026, 3:27:57 PM" },
  { logId: 2, action: "API_SUCCESS", method: "POST", url: "user/verifyotp.php",       status: 200, user: "Raimundas",                             body: "otp: 940547\nuser_id: 426",                   timestamp: "Jun 4, 2026, 3:26:55 PM" },
  { logId: 3, action: "API_SUCCESS", method: "POST", url: "user/login.php",           status: 200, user: "Raimundas",                             body: "password: Raimunda5\nusername: Raimundas",    timestamp: "Jun 4, 2026, 3:26:36 PM" },
  { logId: 4, action: "API_SUCCESS", method: "POST", url: "team/teamlistsubId.php",  status: 200, user: "simon.leonhardt-hansen.ext@veolia.com", body: "subcontId: 147",                              timestamp: "Jun 4, 2026, 3:24:19 PM" },
  { logId: 5, action: "API_SUCCESS", method: "POST", url: "team/teamlistsubId.php",  status: 200, user: "simon.leonhardt-hansen.ext@veolia.com", body: "subcontId: 147",                              timestamp: "Jun 4, 2026, 3:20:47 PM" },
  { logId: 6, action: "API_SUCCESS", method: "POST", url: "user/verifyotp.php",       status: 200, user: "SørenSkjoldmose-SoloService",           body: "otp: 990623\nuser_id: 137",                   timestamp: "Jun 4, 2026, 3:10:08 PM" },
  { logId: 7, action: "API_SUCCESS", method: "POST", url: "user/login.php",           status: 200, user: "SørenSkjoldmose-SoloService",           body: "password: Solo123\nusername: SørenSkjoldmose", timestamp: "Jun 4, 2026, 3:09:57 PM" },
];

const PAGE_LIMIT_DEFAULT = 10;

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
  const isSuccess = status >= 200 && status < 300;
  return (
    <span style={{ color: isSuccess ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
      {status}
    </span>
  );
};

const ActionBadge = ({ action }) => (
  <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13px" }}>
    {action}
  </span>
);

const BodyCell = ({ body }) => (
  <span style={{ whiteSpace: "pre-line", fontSize: "13px" }}>{body}</span>
);

const LogsReports = () => {
  const [searchDate, setSearchDate]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit]                   = useState(PAGE_LIMIT_DEFAULT);

  const filtered = STATIC_LOGS.filter((item) =>
    searchDate ? item.timestamp.toLowerCase().includes(searchDate.toLowerCase()) : true
  );

  const totalPages = Math.ceil(filtered.length / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;
  const paginated  = filtered.slice(startIndex, startIndex + pageLimit);

  const columns = [
    { header: "Action",    accessor: "actionCell" },
    { header: "Method",    accessor: "method"     },
    { header: "URL",       accessor: "url"        },
    { header: "Status",    accessor: "statusCell" },
    { header: "User",      accessor: "user"       },
    { header: "Body",      accessor: "bodyCell"   },
    { header: "Timestamp", accessor: "timestamp"  },
  ];

  const tableData = paginated.map((item) => ({
    ...item,
    actionCell: <ActionBadge action={item.action} />,
    statusCell: <StatusBadge status={item.status} />,
    bodyCell:   <BodyCell body={item.body} />,
  }));

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Logs & Reports</h1>
          <p className="dept-page-subtitle">View all API activity logs and reports</p>
        </div>
      </div>

      <div className="dept-table-card">

        {/* Date Search */}
        <div style={{ padding: "16px" }}>
          <div style={{ position: "relative", maxWidth: "480px" }}>
            <CalendarIcon />
            <input
              type="date"
              className="df-input"
              style={{
                maxWidth: "480px",
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
          isLoading={false}
        />
      </div>

    </div>
  );
};

export default LogsReports;