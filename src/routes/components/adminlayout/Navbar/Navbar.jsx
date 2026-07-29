import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { logout } from "../../../services/authService";
import { navigateTo } from "../../../config/basePath";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
} from "../../../services/notificationService";
import Swal from "sweetalert2";
import { formatToDenmarkDateTime, getDenmarkTimeISOString } from "../../../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Hold', label: 'Hold' },
  { value: 'Pre-Approved', label: 'Pre-Approved' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Opened', label: 'Opened' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Auto-Cancelled', label: 'Auto-Cancelled' },
];

const formatCopenhagenTime = (dateStr) => {
  if (!dateStr) return '';
  const localStr = getDenmarkTimeISOString(new Date(dateStr));
  return formatToDenmarkDateTime(localStr);
};

const extractPermitNo = (n) => {
  if (!n) return "";

  // 1. Check metadata (string or object)
  if (n.metadata) {
    try {
      const meta = typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata;
      if (meta && meta.permitNo) return String(meta.permitNo).trim();
      if (meta && meta.permit_no) return String(meta.permit_no).trim();
      if (meta && meta.permitNumber) return String(meta.permitNumber).trim();
      if (meta && meta.PermitNo) return String(meta.PermitNo).trim();
      if (meta && meta.requestId) return String(meta.requestId).trim();
      if (meta && meta.request_id) return String(meta.request_id).trim();
    } catch (e) {
      console.error("Error parsing notification metadata:", e);
    }
  }

  // 2. Check direct properties on n
  if (n.PermitNo) return String(n.PermitNo).trim();
  if (n.permitNo) return String(n.permitNo).trim();
  if (n.permit_no) return String(n.permit_no).trim();
  if (n.permitNumber) return String(n.permitNumber).trim();
  if (n.permit_number) return String(n.permit_number).trim();
  if (n.permitRequestId) return String(n.permitRequestId).trim();
  if (n.permit_request_id) return String(n.permit_request_id).trim();
  if (n.request_id) return String(n.request_id).trim();
  if (n.requestId) return String(n.requestId).trim();
  if (n.requestNo) return String(n.requestNo).trim();
  if (n.request_no) return String(n.request_no).trim();
  if (n.id_number) return String(n.id_number).trim();

  // 3. Fallback: Parse from title or message using regex
  const text = `${n.title || ""} ${n.message || ""}`;

  const match =
    text.match(/(?:permit|request|id|no\.?)\s*(?:#|\:|\s)*([a-z0-9\-_]+)/i) ||
    text.match(/#([a-z0-9\-_]+)/i);

  if (
    match &&
    match[1] &&
    !["changed", "status", "has", "been", "was", "for", "the", "and"].includes(match[1].toLowerCase())
  ) {
    return match[1].trim();
  }

  return "";
};

const getNotificationStyleInfo = (title = "", message = "") => {
  const t = (title + " " + message).toLowerCase();

  if (t.includes("auto-cancelled") || t.includes("auto cancelled")) {
    return { typeClass: "notif-type-autocancelled", badgeText: "AUTO-CANCELLED" };
  }
  if (t.includes("pre-approved") || t.includes("pre approved") || t.includes("preok") || t.includes("pre-ok")) {
    return { typeClass: "notif-type-preapproved", badgeText: "PRE-APPROVED" };
  }
  if (t.includes("approved")) {
    return { typeClass: "notif-type-approved", badgeText: "APPROVED" };
  }
  if (t.includes("reject") || t.includes("denied")) {
    return { typeClass: "notif-type-rejected", badgeText: "REJECTED" };
  }
  if (t.includes("cancelled") || t.includes("cancel")) {
    return { typeClass: "notif-type-cancelled", badgeText: "CANCELLED" };
  }
  if (t.includes("closed") || t.includes("close")) {
    return { typeClass: "notif-type-closed", badgeText: "CLOSED" };
  }
  if (t.includes("hold")) {
    return { typeClass: "notif-type-hold", badgeText: "HOLD" };
  }
  if (t.includes("draft")) {
    return { typeClass: "notif-type-draft", badgeText: "DRAFT" };
  }
  // Default to Opened
  return { typeClass: "notif-type-opened", badgeText: "OPENED" };
};

/* ── Live Clock ── */
function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="navbar-clock">
      {time.toLocaleTimeString('en-US', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}
    </span>
  )
}

/* ── Sync label (updates every minute) ── */
function SyncLabel() {
  const [label, setLabel] = useState('Just now')

  useEffect(() => {
    let mins = 0
    const id = setInterval(() => {
      mins++
      setLabel(mins === 1 ? '1 min ago' : `${mins} mins ago`)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  return <span className="sync-label">Sync: {label}</span>
}

/* ── Theme Switcher — controlled, synced with Layout state ── */
const THEMES = [
  { value: 'default-dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'midnight-blue', label: 'Midnight' },
  { value: 'steel-gray', label: 'Steel Gray' },
]

function ThemeSwitcher({ theme, onThemeChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentLabel = THEMES.find(t => t.value === theme)?.label ?? 'Dark'

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="theme-switcher" ref={ref}>
      <button className="theme-btn" onClick={() => setOpen(v => !v)}>
        {currentLabel}
        <i className="ti ti-chevron-down" style={{ fontSize: 12, opacity: 0.6 }} />
      </button>
      {open && (
        <div className="theme-menu">
          {THEMES.map(t => (
            <button
              key={t.value}
              className={`theme-option ${theme === t.value ? 'selected' : ''}`}
              onClick={() => {
                onThemeChange(t.value)
                setOpen(false)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════ */
function Navbar({ toggleSidebar, theme, onThemeChange }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const bellRef = useRef(null);

  const [currentUser, setCurrentUser] = useState({
    username: "Alex Mercer",
    role: "Site Manager",
    name: "Alex Mercer"
  });

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  };

  const fetchNotificationsList = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      const res = await getNotifications(pageNum, 10);
      if (append) {
        setNotifications(prev => [...prev, ...res.data]);
      } else {
        setNotifications(res.data);
      }
      setHasMore(res.page < res.totalPages);
      setPage(res.page);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setCurrentUser({
          username: parsed.username || "Alex Mercer",
          role: parsed.role || parsed.userType || "Site Manager",
          name: parsed.username || "Alex Mercer"
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, []);

  const handleToggleNotifications = async () => {
    const nextOpenState = !notificationsOpen;
    setNotificationsOpen(nextOpenState);
    if (nextOpenState) {
      await fetchNotificationsList(1, false);
      try {
        await markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      } catch (e) {
        console.error("Error marking all notifications as read on open:", e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

  const handleNotificationClick = async (n) => {
    if (n.isRead === 0) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: 1 } : item));
      } catch (e) {
        console.error("Error marking notification as read:", e);
      }
    }

    setNotificationsOpen(false);

    const permitNo = extractPermitNo(n);
    if (permitNo) {
      navigate(`/list-request?permitNo=${encodeURIComponent(permitNo)}`, {
        state: { permitNo }
      });
    } else {
      navigate("/list-request");
    }
  };

  const handleOpenSettings = async () => {
    setDropdownOpen(false);
    setSettingsOpen(true);
    try {
      const data = await getNotificationSettings();
      const normSettings = {};
      STATUS_OPTIONS.forEach(opt => {
        const key = opt.value.toLowerCase().trim();
        normSettings[opt.value] = data[key] !== false;
      });
      setSettings(normSettings);
    } catch (e) {
      console.error("Error fetching notification settings:", e);
      const defaultSettings = {};
      STATUS_OPTIONS.forEach(opt => {
        defaultSettings[opt.value] = true;
      });
      setSettings(defaultSettings);
    }
  };

  const handleToggleSetting = (statusName) => {
    setSettings(prev => ({
      ...prev,
      [statusName]: !prev[statusName]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateNotificationSettings(settings);
      setSettingsOpen(false);
      Swal.fire({
        title: "Success",
        text: "Notification settings saved successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      });
    } catch (e) {
      console.error("Error saving notification settings:", e);
      Swal.fire({
        title: "Error",
        text: "Failed to save settings. Please try again.",
        icon: "error",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    navigateTo("/login");
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="top-navbar">

      {/* ── LEFT ── */}
      <div className="navbar-left">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar">
          <i className="ti ti-menu-2" />
        </button>
        <div className="navbar-title">
          <h4>M3 North Dashboard</h4>
          <p>Operational Overview &amp; System Analytics</p>
        </div>
      </div>

      {/* ── CENTER — Status + Clock ── */}
      <div className="navbar-center">
        <LiveClock />
      </div>

      {/* ── RIGHT ── */}
      <div className="navbar-right">

        {/* Theme switcher — now controlled via Layout state */}
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

        {/* Bell with badge */}
        <div className="bell-wrap" ref={bellRef}>
          <button
            className="navbar-bell"
            title="Notifications"
            aria-label="Notifications"
            onClick={handleToggleNotifications}
          >
            <i className="ti ti-bell" />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </button>

          {notificationsOpen && (
            <div className="notifications-dropdown">
              <div className="nd-header">
                <h5 className="nd-title">Notifications</h5>
                {unreadCount > 0 && (
                  <button className="nd-mark-read" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="nd-list">
                {notifications.length === 0 ? (
                  <div className="nd-empty">
                    {isLoading ? "Loading..." : "No notifications"}
                  </div>
                ) : (
                  notifications.map((n) => {
                    const styleInfo = getNotificationStyleInfo(n.title, n.message);
                    const permitNo = extractPermitNo(n);
                    return (
                      <button
                        key={n.id}
                        className={`nd-item ${n.isRead === 0 ? "unread" : ""} ${styleInfo.typeClass}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        {n.isRead === 0 && <span className="nd-item-dot" />}
                        <div className="nd-item-header">
                          <span className="nd-status-badge">{styleInfo.badgeText}</span>
                          <span className="nd-item-time">{formatCopenhagenTime(n.createdAt)}</span>
                        </div>
                        {permitNo && (
                          <div className="nd-item-permit">
                            <span className="nd-permit-label">Permit No:</span> <span className="nd-permit-value">#{permitNo}</span>
                          </div>
                        )}
                        <span className="nd-item-title">{n.title}</span>
                        <span className="nd-item-msg">{n.message}</span>
                      </button>
                    );
                  })
                )}
              </div>
              {hasMore && (
                <div className="nd-footer">
                  <button
                    className="nd-load-more"
                    onClick={() => fetchNotificationsList(page + 1, true)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Load older notifications"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar + name + dropdown */}
        <div className="avatar-wrap" ref={dropdownRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setDropdownOpen(v => !v)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="navbar-avatar-img">{getInitials(currentUser.name)}</div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{currentUser.name}</span>
              <span className="navbar-user-role">{currentUser.role}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown" role="menu">

              {/* Header */}
              <div className="pd-head">
                <div className="pd-avatar">{getInitials(currentUser.name)}</div>
                <div>
                  <div className="pd-name">{currentUser.name}</div>
                  <div className="pd-role">{currentUser.role} · M3 North</div>
                </div>
              </div>

              {/* Account */}
              <div className="pd-section">
                <div className="pd-label">Account</div>
                <a className="pd-item" href="/profile">
                  <i className="ti ti-user" /> My profile
                </a>
                <button
                  className="pd-item"
                  onClick={handleOpenSettings}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <i className="ti ti-settings" /> Notification Settings
                </button>
              </div>

              <div className="pd-divider" />

              {/* Logout */}
              <div className="pd-section">
                <button className="pd-item pd-logout" onClick={handleLogout}>
                  <i className="ti ti-logout" /> Logout
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Notification Settings Modal */}
      {settingsOpen && (
        <div className="ns-modal-overlay">
          <div className="ns-modal">
            <div className="ns-modal-header">
              <h3>Notification Settings</h3>
              <button className="ns-close-btn" onClick={() => setSettingsOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="ns-modal-body">
              <p className="ns-subtitle">Enable or disable in-app notifications for permit request status changes:</p>
              <div className="ns-settings-list">
                {STATUS_OPTIONS.map((opt) => (
                  <div className="ns-setting-item" key={opt.value}>
                    <span className="ns-setting-label">{opt.label}</span>
                    <label className="ns-switch">
                      <input
                        type="checkbox"
                        checked={settings[opt.value] || false}
                        onChange={() => handleToggleSetting(opt.value)}
                      />
                      <span className="ns-slider round"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="ns-modal-footer">
              <button className="ns-btn-secondary" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button className="ns-btn-primary" onClick={handleSaveSettings}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar