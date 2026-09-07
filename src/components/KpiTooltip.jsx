import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Styled tooltip triggered by a ? badge.
 * Renders a floating card above/below the badge using a portal so it
 * never gets clipped by overflow-hidden parent containers.
 */
const KpiTooltip = ({ content }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: "top" });
  const badgeRef = useRef(null);
  const tooltipRef = useRef(null);

  const calcPosition = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const tooltipH = 80; // estimated height
    const tooltipW = 260;
    const spaceAbove = rect.top;
    const placement = spaceAbove > tooltipH + 12 ? "top" : "bottom";

    let left = rect.left + rect.width / 2 - tooltipW / 2;
    // clamp within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));

    const top =
      placement === "top"
        ? rect.top + window.scrollY - tooltipH - 10
        : rect.bottom + window.scrollY + 10;

    setPos({ top, left, placement });
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    calcPosition();
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <>
      <button
        ref={badgeRef}
        onClick={handleOpen}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[8px] font-bold cursor-help leading-none hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
        aria-label="More information"
      >
        ?
      </button>

      {open && (
        <div
          ref={tooltipRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 260,
            zIndex: 99999,
          }}
          className="pointer-events-none"
        >
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45
              bg-gray-900 dark:bg-gray-800 border border-gray-700/40
              ${pos.placement === "top" ? "bottom-[-5px]" : "top-[-5px]"}`}
          />
          {/* Card */}
          <div className="relative bg-gray-900 dark:bg-gray-800 text-white rounded-xl px-3.5 py-3 shadow-2xl border border-gray-700/40">
            <p className="text-[11px] leading-relaxed font-medium text-gray-100">{content}</p>
          </div>
        </div>
      )}
    </>
  );
};

KpiTooltip.propTypes = {
  content: PropTypes.string.isRequired,
};

export default KpiTooltip;
