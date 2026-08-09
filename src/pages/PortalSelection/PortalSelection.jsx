import React, { useEffect } from "react";

/*
 * Legacy portal-selection route.
 *
 * The shared portal selector now lives at:
 * https://beam.safesiteworks.com/
 *
 * This component intentionally redirects using location.replace()
 * so /m3north, /m3south and /m3infrastructure do not remain in
 * browser history.
 *
 * The pageshow listener also handles Chrome back/forward-cache
 * restoration of an older portal page.
 */
function PortalSelection() {
  useEffect(() => {
    const goHome = () => {
      if (
        window.location.pathname !== "/" ||
        window.location.hostname === "beam.safesiteworks.com"
      ) {
        window.location.replace("https://beam.safesiteworks.com/");
      }
    };

    goHome();

    const handlePageShow = () => {
      goHome();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}

export default PortalSelection;
