import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  X,
  Send,
  RotateCcw,
  GripHorizontal,
} from "lucide-react";
const AiChipIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circuit lines */}
    <line x1="20" y1="4" x2="20" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="32" y1="4" x2="32" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="44" y1="4" x2="44" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="20" y1="52" x2="20" y2="60" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="32" y1="52" x2="32" y2="60" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="44" y1="52" x2="44" y2="60" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="20" x2="12" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="32" x2="12" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="44" x2="12" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="52" y1="20" x2="60" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="52" y1="32" x2="60" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="52" y1="44" x2="60" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Chip body */}
    <rect x="12" y="12" width="40" height="40" rx="6" fill="url(#chipGrad)" opacity="0.9"/>
    {/* Inner badge */}
    <rect x="18" y="18" width="28" height="28" rx="5" fill="url(#badgeGrad)"/>
    {/* "AI" text */}
    <text x="32" y="36" textAnchor="middle" dominantBaseline="middle"
      fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13"
      fill="#4f46e5" letterSpacing="1">AI</text>
    <defs>
      <linearGradient id="chipGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.35"/>
        <stop offset="1" stopColor="white" stopOpacity="0.15"/>
      </linearGradient>
      <linearGradient id="badgeGrad" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.9"/>
        <stop offset="1" stopColor="#e0e7ff"/>
      </linearGradient>
    </defs>
  </svg>
);
AiChipIcon.propTypes = { className: PropTypes.string };
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import ChatMessage from "./ChatMessage";

const EDGE_MARGIN = 20; // px gap from screen edges
const BTN_SIZE = 56; // button diameter
const BTN_GAP = 12; // gap between button and panel

// Returns { bottom|top, left|right } inline styles for the FAB
function cornerStyle(corner) {
  return {
    [corner.v]: EDGE_MARGIN,
    [corner.h]: EDGE_MARGIN,
  };
}

// Returns inline styles that open the panel toward the screen center
function panelStyle(corner) {
  const style = { zIndex: 60 };

  // Vertical: if button is at bottom, panel goes up; if at top, panel goes down
  if (corner.v === "bottom") {
    style.bottom = EDGE_MARGIN + BTN_SIZE + BTN_GAP;
  } else {
    style.top = EDGE_MARGIN + BTN_SIZE + BTN_GAP;
  }

  // Horizontal: panel aligns with the same edge as the button
  if (corner.h === "right") {
    style.right = EDGE_MARGIN;
  } else {
    style.left = EDGE_MARGIN;
  }

  return style;
}

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuth();
  const {
    isOpen,
    isStreaming,
    messages,
    isInitialized,
    toggle,
    close,
    initChat,
    sendMessage,
    resetChat,
  } = useChat();

  const [input, setInput] = useState("");
  const [corner, setCorner] = useState({ v: "bottom", h: "right" });
  const [isDragging, setIsDragging] = useState(false);
  const [livePos, setLivePos] = useState(null); // {x,y} cursor while dragging
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef(null);

  // Init chat on first open
  useEffect(() => {
    if (isOpen && !isInitialized) initChat();
  }, [isOpen, isInitialized, initChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Pointer-based drag — distinguishes drag from click
  const handlePointerDown = useCallback((e) => {
    // Only primary button / single touch
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setIsDragging(true);
    setLivePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      if (dx > 6 || dy > 6) hasDraggedRef.current = true;
      setLivePos({ x: e.clientX, y: e.clientY });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return;
      setIsDragging(false);
      setLivePos(null);

      if (hasDraggedRef.current) {
        // Snap to nearest quadrant
        const midX = window.innerWidth / 2;
        const midY = window.innerHeight / 2;
        setCorner({
          v: e.clientY > midY ? "bottom" : "top",
          h: e.clientX > midX ? "right" : "left",
        });
        if (isOpen) close(); // close panel when user repositions button
      } else {
        toggle(); // treat as tap/click
      }
    },
    [isDragging, isOpen, toggle, close],
  );

  if (!isAuthenticated || user?.aiEnabled === false) return null;

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    sendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Live drag position (centred on finger/cursor)
  const fabStyle =
    isDragging && livePos
      ? {
          position: "fixed",
          left: livePos.x - BTN_SIZE / 2,
          top: livePos.y - BTN_SIZE / 2,
          zIndex: 9999,
          cursor: "grabbing",
          transition: "none",
        }
      : {
          position: "fixed",
          zIndex: 9999,
          cursor: "grab",
          transition: "box-shadow 0.2s",
          ...cornerStyle(corner),
        };

  return (
    <>
      <style>{`
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeOut   { from { opacity:1 } to { opacity:0 } }
      `}</style>
      {/* ── Tooltip (auto-dismiss after 5 s) ── */}
      {showTooltip && !isOpen && !isDragging && (
        <div
          style={{
            position: "fixed",
            bottom: fabStyle?.bottom == null ? "auto" : fabStyle.bottom + 70,
            top:    fabStyle?.top    == null ? "auto" : fabStyle.top    + 70,
            right:  fabStyle?.right  == null ? "auto" : fabStyle.right,
            left:   fabStyle?.left   == null ? "auto" : fabStyle.left,
            zIndex: 9999,
            animation: "fadeInUp 0.3s ease, fadeOut 0.4s ease 4.6s forwards",
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium shadow-xl pointer-events-none whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Hi! Ask me anything about your cloud costs 👋
          {/* Tail */}
          <span style={{ position:"absolute", bottom:-6, right:14, width:0, height:0,
            borderLeft:"6px solid transparent", borderRight:"6px solid transparent",
            borderTop:"6px solid #111827" }} />
        </div>
      )}

      {/* ── Floating action button (chat-bubble shape) ── */}
      {/* Pulse rings — only when closed */}
      {!isOpen && !isDragging && (
        <>
          <span
            style={{ ...fabStyle, borderRadius: "18px 18px 4px 18px", width: 60, height: 56 }}
            className="absolute animate-ping opacity-30 bg-blue-900 pointer-events-none"
          />
          <span
            style={{ ...fabStyle, borderRadius: "18px 18px 4px 18px", width: 60, height: 56, animationDelay: "0.4s" }}
            className="absolute animate-ping opacity-20 bg-indigo-900 pointer-events-none"
          />
        </>
      )}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          ...fabStyle,
          borderRadius: "18px 18px 4px 18px",
          width: 60,
          height: 56,
        }}
        className={[
          "relative",
          "bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900",
          "shadow-lg shadow-blue-900/60 hover:shadow-xl hover:shadow-indigo-900/70",
          "flex items-center justify-center text-white",
          "select-none touch-none",
          isDragging
            ? "scale-110 opacity-90"
            : "hover:scale-105 active:scale-95",
          "transition-transform duration-150",
        ].join(" ")}
        aria-label="Toggle AI Copilot"
      >
        {/* Tail triangle at bottom-right */}
        <span
          style={{
            position: "absolute",
            bottom: -7,
            right: 6,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderTop: "8px solid #1e1b4b",
          }}
        />
        {/* Blinking notification dot */}
        {!isOpen && !isDragging && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-bounce" />
        )}
        {(() => {
          if (isDragging) return <GripHorizontal className="w-5 h-5 opacity-80" />;
          if (isOpen) return <X className="w-6 h-6" />;
          return <AiChipIcon className="w-8 h-8" />;
        })()}
      </button>

      {/* ── Chat panel ── */}
      {isOpen && !isDragging && (
        <div
          style={panelStyle(corner)}
          className={[
            // Responsive size: max 420×580, but constrained to viewport
            "fixed",
            "w-[min(420px,calc(100vw-2.5rem))]",
            "h-[min(580px,calc(100vh-8rem))]",
            "flex flex-col",
            "rounded-2xl shadow-2xl",
            "border border-gray-200 dark:border-gray-700",
            "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-blue-100 dark:border-blue-900/40 flex-shrink-0 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-300/50 flex-shrink-0">
                <AiChipIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-none text-gray-900 dark:text-white">AI Copilot</p>
                <p className="text-xs text-gray-400 mt-0.5">Provided by Maitsys</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400 dark:text-gray-500">
                <AiChipIcon className="w-10 h-10 opacity-30" />
                <p className="text-sm">Loading assistant…</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSuggestionClick={(s) => {
                  if (!isStreaming) sendMessage(s);
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>


          {/* Input row */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-end flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your cloud costs…"
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors disabled:opacity-50"
              style={{ fontSize: "16px", maxHeight: "96px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
