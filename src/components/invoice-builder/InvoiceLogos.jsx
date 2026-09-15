import React from "react";
import PropTypes from "prop-types";

/**
 * The two invoice sender marks, shared by LogoPicker.jsx and
 * InvoicePreview.jsx so both render the exact same mark.
 *
 * CCM's real logo is the existing /app-logo.png asset (cloud + rising-line
 * "M" mark) — that file was previously mislabeled "Maitsys" in this
 * feature; it's actually CCM's.
 *
 * Maitsys's real logo (a red circle with a white chevron + "MAITSYS"
 * wordmark) doesn't exist as a project asset yet, so MaitsysMark is an
 * inline-SVG approximation of it — swap it for a real <img src="..."> once
 * the actual file is dropped into public/.
 */
export const CCM_LOGO_SRC = "/app-logo.png";

export const MaitsysMark = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Maitsys">
    <circle cx="50" cy="50" r="50" fill="#E5342B" />
    <polygon points="34,22 52,22 70,50 52,78 34,78 52,50" fill="#fff" />
  </svg>
);
MaitsysMark.propTypes = { className: PropTypes.string };
