import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../../../components/common/PublicRoute";

const PublicRoute = ({ children }) => {
  if (isTokenValid()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
