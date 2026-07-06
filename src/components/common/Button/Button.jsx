import React from "react";
import "./Button.css";

function Button({
  text,
  type = "button",
  onClick,
  variant = "primary",
  size = "medium",
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = "left",   /* "left" | "right" */
  loading = false,
}) {
  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      className={`
        beam-btn
        beam-btn--${variant}
        beam-btn--${size}
        ${fullWidth  ? "beam-btn--full"    : ""}
        ${loading    ? "beam-btn--loading" : ""}
        ${iconPosition === "right" ? "beam-btn--icon-right" : ""}
      `}
    >
      {/* Spinner shown while loading */}
      {loading && (
        <span className="beam-btn-spinner" aria-hidden="true" />
      )}

      {/* Icon (hidden while loading) */}
      {!loading && icon && (
        <span className="beam-btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Label */}
      {text && (
        <span className="beam-btn-label">
          {loading ? "Loading…" : text}
        </span>
      )}
    </button>
  );
}

export default Button;