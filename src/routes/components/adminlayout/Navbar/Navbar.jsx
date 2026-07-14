import React, { useState, useRef, useEffect } from 'react'
import "./Navbar.css";
import { logout } from "../../../services/authService";
import { navigateTo } from "../../../config/basePath";

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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [currentUser, setCurrentUser] = useState({
    username: "Alex Mercer",
    role: "Site Manager",
    name: "Alex Mercer"
  });

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
          <h4>M3 Infrastructure Dashboard</h4>
          <p>Operational Overview &amp; System Analytics</p>
        </div>
      </div>

      {/* ── CENTER — Status + Clock ── */}
      <div className="navbar-center">
        {/* <div className="navbar-status-row">
          <div className="status-pill">
            <span className="status-dot" />
            System Online
          </div>
          <SyncLabel />
        </div> */}
        <LiveClock />
      </div>

      {/* ── RIGHT ── */}
      <div className="navbar-right">

        {/* Theme switcher — now controlled via Layout state */}
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

        {/* Bell with badge */}
        <button className="navbar-bell" title="Notifications" aria-label="Notifications">
          <i className="ti ti-bell" />
          <span className="bell-badge">5</span>
        </button>

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
                  <div className="pd-role">{currentUser.role} · M3 Infrastructure</div>
                </div>
              </div>

              {/* Account */}
              <div className="pd-section">
                <div className="pd-label">Account</div>
                <a className="pd-item" href="/profile">
                  <i className="ti ti-user" /> My profile
                </a>
                {/* <a className="pd-item" href="/credentials">
                  <i className="ti ti-id-badge" /> Credentials &amp; certifications
                  <span className="pd-badge b-ok">Valid</span>
                </a>
                <a className="pd-item" href="/change-password">
                  <i className="ti ti-lock" /> Change password
                </a> */}
              </div>

              {/* <div className="pd-divider" /> */}

              {/* Safety */}
              {/* <div className="pd-section">
                <div className="pd-label">Safety</div>
                <a className="pd-item" href="/incidents">
                  <i className="ti ti-alert-triangle" /> My incident reports
                  <span className="pd-badge b-warn">2 open</span>
                </a>
                <a className="pd-item" href="/checklists">
                  <i className="ti ti-checklist" /> Safety checklists
                </a>
                <a className="pd-item" href="/ppe">
                  <i className="ti ti-shield-check" /> PPE compliance
                  <span className="pd-badge b-ok">100%</span>
                </a>
                <a className="pd-item" href="/risk">
                  <i className="ti ti-chart-bar" /> Risk assessments
                </a>
                <a className="pd-item" href="/emergency">
                  <i className="ti ti-bell-ringing" /> Emergency contacts
                  <span className="pd-badge b-danger">Review</span>
                </a>
              </div> */}

              {/* <div className="pd-divider" /> */}

              {/* Preferences */}
              {/* <div className="pd-section">
                <div className="pd-label">Preferences</div>
                <a className="pd-item" href="/settings">
                  <i className="ti ti-settings" /> Settings
                </a>
                <a className="pd-item" href="/help">
                  <i className="ti ti-help-circle" /> Help &amp; support
                </a>
              </div> */}

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
    </nav>
  )
}

export default Navbar