import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../../../components/common/PublicRoute";
import { BASE_PATH } from "../../../config/basePath";

const PublicRoute = ({ children }) => {
  React.useEffect(() => {
    const handleCheck = () => {
      if (isTokenValid()) {
        window.location.replace(BASE_PATH + "/dashboard");
      }
    };

    window.addEventListener("pageshow", handleCheck);
    window.addEventListener("popstate", handleCheck);

    return () => {
      window.removeEventListener("pageshow", handleCheck);
      window.removeEventListener("popstate", handleCheck);
    };
  }, []);

  if (isTokenValid()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
