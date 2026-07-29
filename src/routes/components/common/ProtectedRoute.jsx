import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../../../components/common/PublicRoute";
import { BASE_PATH } from "../../../config/basePath";

const ProtectedRoute = ({ children, allowedRoles }) => {
  React.useEffect(() => {
    const handleCheck = () => {
      if (!isTokenValid()) {
        window.location.replace(BASE_PATH + "/login");
      } else {
        const appPath = window.location.pathname.replace(BASE_PATH, '') || '/';
        if (appPath === '/login' || appPath === '/otp' || appPath === '/') {
          window.location.replace(BASE_PATH + '/dashboard');
        }
      }
    };

    window.addEventListener("pageshow", handleCheck);
    window.addEventListener("popstate", handleCheck);

    return () => {
      window.removeEventListener("pageshow", handleCheck);
      window.removeEventListener("popstate", handleCheck);
    };
  }, []);

  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    try {
      const user = localStorage.getItem("user");
      const parsedUser = user ? JSON.parse(user) : null;
      const userRole = parsedUser ? (parsedUser.role || parsedUser.userType) : "";

      let userRoles = [];
      if (typeof userRole === "string") {
        userRoles = userRole.split(",").map(r => r.trim());
      } else if (Array.isArray(userRole)) {
        userRoles = userRole;
      } else if (userRole) {
        userRoles = [userRole];
      }

      const hasAccess = userRoles.some(r => allowedRoles.includes(r));
      if (!hasAccess) {
        return <Navigate to="/dashboard" replace />;
      }
    } catch {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;