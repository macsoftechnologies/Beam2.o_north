import React from "react";
import "./Loader.css";

function Loader({
  size = "md",
  fullScreen = false,
  text = "Loading...",
}) {
  return (
    <div
      className={`
        beam-loader-wrapper
        ${fullScreen ? "beam-loader-wrapper--fullscreen" : ""}
      `}
    >
      {/* Spinner ring */}
      <div className={`beam-loader beam-loader--${size}`}>
        <span className="beam-loader-ring" aria-hidden="true" />
      </div>

      {/* Optional label */}
      {text && (
        <p className="beam-loader-text">{text}</p>
      )}
    </div>
  );
}

export default Loader;