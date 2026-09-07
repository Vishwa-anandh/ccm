import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

// Auto-rolling title: slides left/right on its own when the full text doesn't fit
// its container, instead of truncating with "…" or requiring a manual scroll.
// Pass a className to control the text's own styling (font, color, size, etc).
const MarqueeTitle = ({ text, className }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const textWidth = textRef.current?.scrollWidth ?? 0;
      const overflow = textWidth - containerWidth;
      setDistance(overflow > 2 ? -overflow : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <div ref={containerRef} className="min-w-0 flex-1 overflow-hidden">
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className ?? ""} ${distance ? "animate-marquee-slide" : ""}`}
        style={distance ? { "--marquee-distance": `${distance}px` } : undefined}
      >
        {text}
      </span>
    </div>
  );
};

MarqueeTitle.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};

MarqueeTitle.defaultProps = {
  className: "",
};

export default MarqueeTitle;
