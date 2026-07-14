import { useState, useEffect } from "react";
import { formatToDenmarkDateTime } from "../../utils/dateUtils";

const TYPE_STYLES = {
    Hold: { color: "#f59e0b", bg: "#f59e0b22", icon: "⏸" },
    Edited: { color: "#4a9eff", bg: "#4a9eff22", icon: "✏️" },
    Approved: { color: "#22c55e", bg: "#22c55e22", icon: "✅" },
    Opened: { color: "#a78bfa", bg: "#a78bfa22", icon: "🔓" },
    Closed: { color: "#6b7280", bg: "#6b728022", icon: "🔒" },
    Rejected: { color: "#ef4444", bg: "#ef444422", icon: "❌" },
    Cancelled: { color: "#ef4444", bg: "#ef444422", icon: "🚫" },
    Draft: { color: "#94a3b8", bg: "#94a3b822", icon: "📝" },
    Submitted: { color: "#38bdf8", bg: "#38bdf822", icon: "📤" },
};

const getTypeStyle = (type) =>
    TYPE_STYLES[type] || { color: "#7a8aab", bg: "#7a8aab22", icon: "•" };

const formatDateTime = (iso) => {
    return formatToDenmarkDateTime(iso);
};

const LogHistoryModal = ({ permit, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleViewLogsHtml = () => {
        window.open(`http://187.127.171.51/requests/logs-design/${permit.PermitNo}`, "_blank");
    };

    useEffect(() => {
        if (!permit?.PermitNo) return;

        const fetchLogs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `http://187.127.171.51/requests/logs/permit/${permit.PermitNo}`
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setLogs(Array.isArray(json.data) ? json.data : []);
            } catch (err) {
                setError("Failed to load permit logs.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [permit?.PermitNo]);

    if (!permit) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    top: "70px", left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.65)",
                    zIndex: 9998,
                }}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed", top: "70px", right: 0,
                width: "500px", maxWidth: "95vw",
                height: "calc(100vh - 70px)",
                backgroundColor: "var(--bg-card)",
                borderLeft: "1px solid var(--border-color)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}>

                {/* ── Header ── */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    backgroundColor: "var(--bg-card)",
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)", fontWeight: 600 }}>
                            Permit Activity Log
                        </h2>
                        <span style={{
                            fontSize: "13px", color: "var(--text-muted)",
                            fontFamily: "monospace", marginTop: "4px", display: "block",
                        }}>
                            #{permit.PermitNo}
                        </span>
                        {logs.length > 0 && (
                            <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                    🏢 {logs[0].Company_Name}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                    👷 {logs[0].contractor_name}
                                </span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <button
                            onClick={handleViewLogsHtml}
                            title="View Logs Page"
                            style={{
                                background: "#10b981",
                                border: "none",
                                borderRadius: "6px",
                                color: "#ffffff",
                                cursor: "pointer",
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 600,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Logs
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: "none", border: "none",
                                color: "var(--text-muted)", cursor: "pointer",
                                fontSize: "20px", lineHeight: 1,
                                padding: "4px",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

                    {/* Loading */}
                    {isLoading && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{
                                width: "36px", height: "36px",
                                border: "3px solid var(--border-color)",
                                borderTopColor: "var(--accent)",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                                margin: "0 auto 12px",
                            }} />
                            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                                Loading activity log…
                            </p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <div style={{
                            backgroundColor: "#ef444422",
                            border: "1px solid #ef444444",
                            borderRadius: "8px",
                            padding: "16px",
                            color: "#ef4444",
                            fontSize: "14px",
                            textAlign: "center",
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && logs.length === 0 && (
                        <div style={{
                            textAlign: "center", padding: "48px 0",
                            color: "var(--text-muted)", fontSize: "14px",
                        }}>
                            No activity found for this permit.
                        </div>
                    )}

                    {/* ── Timeline ── */}
                    {!isLoading && !error && logs.length > 0 && (
                        <div style={{ position: "relative" }}>

                            {/* Vertical line */}
                            <div style={{
                                position: "absolute",
                                left: "19px", top: "8px",
                                bottom: "8px",
                                width: "2px",
                                backgroundColor: "var(--border-color)",
                            }} />

                            {logs.map((log, index) => {
                                const style = getTypeStyle(log.requestType);
                                return (
                                    <div key={log.id} style={{
                                        display: "flex",
                                        gap: "16px",
                                        marginBottom: index < logs.length - 1 ? "24px" : 0,
                                        position: "relative",
                                    }}>

                                        {/* Timeline dot */}
                                        <div style={{
                                            width: "40px",
                                            flexShrink: 0,
                                            display: "flex",
                                            justifyContent: "center",
                                            paddingTop: "2px",
                                            position: "relative",
                                            zIndex: 1,
                                        }}>
                                            <div style={{
                                                width: "32px", height: "32px",
                                                borderRadius: "50%",
                                                backgroundColor: style.bg,
                                                border: `2px solid ${style.color}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "14px",
                                            }}>
                                                {style.icon}
                                            </div>
                                        </div>

                                        {/* Card */}
                                        <div style={{
                                            flex: 1,
                                            backgroundColor: "var(--bg-card-hover)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "10px",
                                            padding: "14px 16px",
                                        }}>

                                            {/* Top row: type badge + time */}
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "8px",
                                                flexWrap: "wrap",
                                                gap: "6px",
                                            }}>
                                                <span style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: 700,
                                                    backgroundColor: style.bg,
                                                    color: style.color,
                                                    border: `1px solid ${style.color}44`,
                                                    letterSpacing: "0.3px",
                                                }}>
                                                    {log.requestType}
                                                </span>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                    🕐 {formatDateTime(log.createdTime)}
                                                </span>
                                            </div>

                                            {/* User info */}
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                marginBottom: log.fields?.length > 0 ? "12px" : 0,
                                            }}>
                                                {/* Avatar */}
                                                <div style={{
                                                    width: "28px", height: "28px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "var(--bg-card)",
                                                    border: "1px solid var(--border-color)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "12px",
                                                    color: "var(--accent, #4a9eff)",
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {log.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>
                                                        {log.username}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                                                        {log.userType}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Field changes (only for Edited) */}
                                            {log.fields?.length > 0 && (
                                                <div style={{
                                                    marginTop: "10px",
                                                    borderTop: "1px solid var(--border-color)",
                                                    paddingTop: "10px",
                                                }}>
                                                    <p style={{
                                                        margin: "0 0 8px",
                                                        fontSize: "11px",
                                                        color: "var(--text-muted)",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}>
                                                        Changes Made
                                                    </p>
                                                    {log.fields.map((f) => (
                                                        <div key={f.logs_data_id} style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "8px 10px",
                                                            backgroundColor: "var(--bg-card)",
                                                            borderRadius: "6px",
                                                            marginBottom: "6px",
                                                            flexWrap: "wrap",
                                                        }}>
                                                            {/* Field name */}
                                                            <span style={{
                                                                fontSize: "12px",
                                                                color: "var(--text-main)",
                                                                fontWeight: 600,
                                                                minWidth: "90px",
                                                            }}>
                                                                {f.field_name}
                                                            </span>

                                                            {/* Previous */}
                                                            <span style={{
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                                fontSize: "12px",
                                                                backgroundColor: "#ef444422",
                                                                color: "#ef4444",
                                                                border: "1px solid #ef444433",
                                                                textDecoration: "line-through",
                                                            }}>
                                                                {f.previous || "—"}
                                                            </span>

                                                            {/* Arrow */}
                                                            <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</span>

                                                            {/* Present */}
                                                            <span style={{
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                                fontSize: "12px",
                                                                backgroundColor: "#22c55e22",
                                                                color: "#22c55e",
                                                                border: "1px solid #22c55e33",
                                                            }}>
                                                                {f.present || "—"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
};

export default LogHistoryModal;