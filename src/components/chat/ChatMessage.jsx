import React from 'react';
import PropTypes from 'prop-types';
import { User } from 'lucide-react';

const AiChipIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <rect x="12" y="12" width="40" height="40" rx="6" fill="white" fillOpacity="0.25"/>
    <rect x="18" y="18" width="28" height="28" rx="5" fill="white" fillOpacity="0.9"/>
    <text x="32" y="36" textAnchor="middle" dominantBaseline="middle"
      fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13"
      fill="#4f46e5" letterSpacing="1">AI</text>
  </svg>
);
AiChipIcon.propTypes = { className: PropTypes.string };

function renderContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (!line.trim()) return <br key={i} />;

    // Bold + inline formatting
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formatted = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet list
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc text-sm">
          {formatted}
        </li>
      );
    }

    // Heading
    if (/^#{1,3}\s/.test(line)) {
      return <p key={i} className="font-bold text-sm mt-2">{line.replace(/^#+\s/, '')}</p>;
    }

    return <p key={i} className="text-sm leading-relaxed">{formatted}</p>;
  });
}

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center mt-1 shadow-sm shadow-blue-300/50">
          <AiChipIcon className="w-5 h-5" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}
        >
          {message.content
            ? renderContent(message.content)
            : <span className="inline-flex gap-1"><span className="animate-bounce">●</span><span className="animate-bounce" style={{animationDelay:'0.1s'}}>●</span><span className="animate-bounce" style={{animationDelay:'0.2s'}}>●</span></span>
          }
        </div>

        {!isUser && message.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s)}
                className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-gray-700 dark:text-gray-200" />
        </div>
      )}
    </div>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    suggestions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onSuggestionClick: PropTypes.func,
};
