import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");

  if (!token) {
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