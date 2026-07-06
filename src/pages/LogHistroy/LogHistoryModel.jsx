import React, { useState, useEffect } from "react";

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
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const LogHistoryModal = ({ permit, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!permit?.PermitNo) return;

        const fetchLogs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `http://187.127.171.51/m3north/requests/logs/permit/${permit.PermitNo}`
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
                    position: "fixed", inset: 0,
                    backgroundColor: "rgba(0,0,0,0.65)",
                    zIndex: 1000,
                }}
            />

            {/* Drawer */}
            <div style={{
                position: "fixed", top: 0, right: 0,
                width: "500px", maxWidth: "95vw",
                height: "100vh",
                backgroundColor: "#0f1a33",
                borderLeft: "1px solid #2e3f66",
                zIndex: 1001,
                display: "flex",
                flexDirection: "column",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}>

                {/* ── Header ── */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #2e3f66",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    backgroundColor: "#0f1a33",
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "16px", color: "#ffffff", fontWeight: 600 }}>
                            Permit Activity Log
                        </h2>
                        <span style={{
                            fontSize: "13px", color: "#7a8aab",
                            fontFamily: "monospace", marginTop: "4px", display: "block",
                        }}>
                            #{permit.PermitNo}
                        </span>
                        {logs.length > 0 && (
                            <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", color: "#7a8aab" }}>
                                    🏢 {logs[0].Company_Name}
                                </span>
                                <span style={{ fontSize: "12px", color: "#7a8aab" }}>
                                    👷 {logs[0].contractor_name}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none",
                            color: "#7a8aab", cursor: "pointer",
                            fontSize: "20px", lineHeight: 1,
                            padding: "4px", marginLeft: "12px", flexShrink: 0,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

                    {/* Loading */}
                    {isLoading && (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{
                                width: "36px", height: "36px",
                                border: "3px solid #2e3f66",
                                borderTopColor: "#4a9eff",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                                margin: "0 auto 12px",
                            }} />
                            <p style={{ color: "#7a8aab", fontSize: "14px", margin: 0 }}>
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
                            color: "#7a8aab", fontSize: "14px",
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
                                backgroundColor: "#2e3f66",
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
                                            backgroundColor: "#1a2744",
                                            border: "1px solid #2e3f66",
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
                                                <span style={{ fontSize: "11px", color: "#7a8aab" }}>
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
                                                    backgroundColor: "#0f1a33",
                                                    border: "1px solid #2e3f66",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "12px",
                                                    color: "#4a9eff",
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {log.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", fontWeight: 500 }}>
                                                        {log.username}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "11px", color: "#7a8aab" }}>
                                                        {log.userType}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Field changes (only for Edited) */}
                                            {log.fields?.length > 0 && (
                                                <div style={{
                                                    marginTop: "10px",
                                                    borderTop: "1px solid #2e3f66",
                                                    paddingTop: "10px",
                                                }}>
                                                    <p style={{
                                                        margin: "0 0 8px",
                                                        fontSize: "11px",
                                                        color: "#7a8aab",
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
                                                            backgroundColor: "#0f1a33",
                                                            borderRadius: "6px",
                                                            marginBottom: "6px",
                                                            flexWrap: "wrap",
                                                        }}>
                                                            {/* Field name */}
                                                            <span style={{
                                                                fontSize: "12px",
                                                                color: "#94a3b8",
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
                                                            <span style={{ color: "#7a8aab", fontSize: "14px" }}>→</span>

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