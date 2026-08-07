import axios from "axios";

// ─── Standalone axios instance for logging only ────────────────────────────────
// We deliberately do NOT import from "./api" here to avoid a circular dependency
// (api.js → userLogService.js → api.js). Using a raw axios instance instead.
const LOG_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const logAxios = axios.create({
  baseURL: LOG_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the auth token to log requests
logAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// Ordered most-specific first so shorter prefixes don't match too early.

const ACTION_MAP = [
  // Auth
  { method: "POST", pattern: /\/auth\/login$/i, action: "LOGIN" },
  { method: "POST", pattern: /\/auth\/verify-otp$/i, action: "OTP_VERIFY" },

  // Employees — specific sub-routes first
  { method: "POST", pattern: /\/employee\/dep$/i, action: "DEPT_EMPLOYEE_CREATED" },
  { method: "POST", pattern: /\/employee\/sub$/i, action: "SUB_EMPLOYEE_CREATED" },
  { method: "POST", pattern: /\/employee\/emp$/i, action: "EMPLOYEE_CREATED" },
  { method: "POST", pattern: /\/employee\/search$/i, action: "EMPLOYEE_SEARCH" },
  { method: "POST", pattern: /\/employee\/check-username$/i, action: "USERNAME_CHECK" },
  { method: "POST", pattern: /\/employee\/list-by-dept$/i, action: "EMPLOYEE_LIST" },
  { method: "POST", pattern: /\/employee$/i, action: "EMPLOYEE_CREATED" },
  { method: "PUT", pattern: /\/employee\/dep$/i, action: "DEPT_EMPLOYEE_UPDATED" },
  { method: "PUT", pattern: /\/employee\/sub$/i, action: "SUB_EMPLOYEE_UPDATED" },
  { method: "PUT", pattern: /\/employee\/emp$/i, action: "EMPLOYEE_UPDATED" },
  { method: "PUT", pattern: /\/employee$/i, action: "EMPLOYEE_UPDATED" },
  { method: "DELETE", pattern: /\/employee\/user$/i, action: "EMPLOYEE_DELETED" },
  { method: "DELETE", pattern: /\/employee$/i, action: "EMPLOYEE_DELETED" },

  // Departments
  { method: "POST", pattern: /\/departments\/?$/i, action: "DEPARTMENT_CREATED" },
  { method: "PUT", pattern: /\/departments\/\d+$/i, action: "DEPARTMENT_UPDATED" },
  { method: "DELETE", pattern: /\/departments\/\d+$/i, action: "DEPARTMENT_DELETED" },

  // Subcontractors
  { method: "POST", pattern: /\/subcontractors\/?$/i, action: "CONTRACTOR_CREATED" },
  { method: "PUT", pattern: /\/subcontractors\/\d+$/i, action: "CONTRACTOR_UPDATED" },
  { method: "DELETE", pattern: /\/subcontractors\/\d+$/i, action: "CONTRACTOR_DELETED" },

  // Activities
  { method: "POST", pattern: /\/activities\/?$/i, action: "ACTIVITY_CREATED" },
  { method: "PUT", pattern: /\/activities\/\d+$/i, action: "ACTIVITY_UPDATED" },
  { method: "DELETE", pattern: /\/activities\/\d+$/i, action: "ACTIVITY_DELETED" },

  // Precautions
  { method: "POST", pattern: /\/precautions\/?$/i, action: "PRECAUTION_CREATED" },
  { method: "PUT", pattern: /\/precautions\/\d+$/i, action: "PRECAUTION_UPDATED" },
  { method: "DELETE", pattern: /\/precautions\/\d+$/i, action: "PRECAUTION_DELETED" },

  // Buildings
  { method: "POST", pattern: /\/buildings\/?$/i, action: "BUILDING_CREATED" },
  { method: "PUT", pattern: /\/buildings\/\d+$/i, action: "BUILDING_UPDATED" },
  { method: "DELETE", pattern: /\/buildings\/\d+$/i, action: "BUILDING_DELETED" },

  // Floors
  { method: "POST", pattern: /\/floors\/?$/i, action: "FLOOR_CREATED" },
  { method: "PUT", pattern: /\/floors\/\d+$/i, action: "FLOOR_UPDATED" },
  { method: "DELETE", pattern: /\/floors\/\d+$/i, action: "FLOOR_DELETED" },

  // Zones
  { method: "POST", pattern: /\/zones\/?$/i, action: "ZONE_CREATED" },
  { method: "PUT", pattern: /\/zones\/\d+$/i, action: "ZONE_UPDATED" },
  { method: "DELETE", pattern: /\/zones\/\d+$/i, action: "ZONE_DELETED" },

  // Rooms
  { method: "POST", pattern: /\/rooms\/?$/i, action: "ROOM_CREATED" },
  { method: "PUT", pattern: /\/rooms\/\d+$/i, action: "ROOM_UPDATED" },
  { method: "DELETE", pattern: /\/rooms\/\d+$/i, action: "ROOM_DELETED" },

  // Mechanical Works
  { method: "POST", pattern: /\/mechanical\/?$/i, action: "MECHANICAL_CREATED" },
  { method: "PUT", pattern: /\/mechanical\/\d+$/i, action: "MECHANICAL_UPDATED" },
  { method: "DELETE", pattern: /\/mechanical\/\d+$/i, action: "MECHANICAL_DELETED" },

  // Electrical Works
  { method: "POST", pattern: /\/electrical\/?$/i, action: "ELECTRICAL_CREATED" },
  { method: "PUT", pattern: /\/electrical\/\d+$/i, action: "ELECTRICAL_UPDATED" },
  { method: "DELETE", pattern: /\/electrical\/\d+$/i, action: "ELECTRICAL_DELETED" },

  // Roles
  { method: "POST", pattern: /\/roles\/?$/i, action: "ROLE_CREATED" },
  { method: "PUT", pattern: /\/roles\/\d+$/i, action: "ROLE_UPDATED" },
  { method: "DELETE", pattern: /\/roles\/\d+$/i, action: "ROLE_DELETED" },

  // Requests / Permits — specific sub-routes first
  { method: "POST", pattern: /\/requests\/search$/i, action: "PERMIT_SEARCH" },
  { method: "POST", pattern: /\/requests\/plans$/i, action: "PERMIT_PLANS_VIEW" },
  { method: "POST", pattern: /\/requests\/analytics/i, action: "PERMIT_ANALYTICS" },
  { method: "POST", pattern: /\/requests\/counts/i, action: "PERMIT_COUNTS" },
  { method: "POST", pattern: /\/requests\/?$/i, action: "PERMIT_REQUESTED" },
  { method: "PUT", pattern: /\/requests\/\d+$/i, action: "PERMIT_UPDATED" },
  { method: "DELETE", pattern: /\/requests\/\d+$/i, action: "PERMIT_DELETED" },
];

/**
 * Derives a human-readable action label from the HTTP method + URL path.
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, …)
 * @param {string} url    - Request URL path, e.g. "/departments/5"
 * @returns {string}
 */
export function getActionLabel(method, url) {
  const m = (method || "").toUpperCase();
  const u = url || "";

  for (const entry of ACTION_MAP) {
    if (entry.method === m && entry.pattern.test(u)) {
      return entry.action;
    }
  }

  // Fallback: compose from method + last non-numeric path segment
  const segments = u.split("/").filter(Boolean);
  const lastSeg = [...segments].reverse().find((s) => !/^\d+$/.test(s));
  if (lastSeg) {
    const methodLabel =
      m === "POST" ? "CREATED" :
        m === "PUT" || m === "PATCH" ? "UPDATED" :
          m === "DELETE" ? "DELETED" :
            "ACTION";
    return `${lastSeg.toUpperCase()}_${methodLabel}`;
  }

  return "API_ACTION";
}

/**
 * Builds the log payload and fires POST /employee/log.
 * This is intentionally fire-and-forget — errors are swallowed so they
 * never disrupt the caller's main API flow.
 *
 * @param {import("axios").InternalAxiosRequestConfig} config   - Original request config
 * @param {import("axios").AxiosResponse}              response - API response object
 */
export function sendUserLog(config, response) {
  try {
    const method = (config.method || "").toUpperCase();
    const url = config.url || "";

    // Build body string with password masked
    let bodyStr = "";
    try {
      const bodyObj =
        typeof config.data === "string"
          ? JSON.parse(config.data)
          : config.data
            ? { ...config.data }
            : {};
      if (bodyObj.password) bodyObj.password = "••••••";
      if (bodyObj.Password) bodyObj.Password = "••••••";
      bodyStr = JSON.stringify(bodyObj);
    } catch {
      bodyStr = typeof config.data === "string" ? config.data : "";
    }

    // Retrieve logged-in user from localStorage
    let userStr = "";
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        userStr = JSON.stringify({
          displayName:
            parsed.employeeName || parsed.username || parsed.name || "",
          username: parsed.username || "",
          email: parsed.email || "",
        });
      }
    } catch {
      userStr = localStorage.getItem("user") || "";
    }

    const payload = {
      action: getActionLabel(method, url),
      method,
      url,
      status: String(response?.status ?? ""),
      user: userStr,
      body: bodyStr,
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget — do NOT await, do NOT re-throw
    logAxios.post("/employee/log", payload).catch(() => {
      // Silently ignore logging failures — never surface to UI
    });
  } catch {
    // Outer safety net — logging must never break anything
  }
}
