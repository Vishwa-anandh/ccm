import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';

const AI_URL = import.meta.env.VITE_AI_COPILOT_URL || 'http://localhost:3002';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const initialState = {
  messages: [],
  isOpen: false,
  isStreaming: false,
  suggestions: [],
  isInitialized: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN':   return { ...state, isOpen: true };
    case 'CLOSE':  return { ...state, isOpen: false };
    case 'TOGGLE': return { ...state, isOpen: !state.isOpen };

    case 'INIT_SUCCESS':
      return {
        ...state,
        isInitialized: true,
        suggestions: action.suggestions || [],
        messages: action.welcomeMessage
          ? [{ id: genId(), role: 'assistant', content: action.welcomeMessage, suggestions: action.suggestions }]
          : [],
      };

    case 'ADD_USER_MSG':
      return { ...state, messages: [...state.messages, { id: genId(), role: 'user', content: action.content }] };

    case 'START_STREAM': {
      const id = action.id;
      return {
        ...state,
        isStreaming: true,
        streamingId: id,
        messages: [...state.messages, { id, role: 'assistant', content: '' }],
      };
    }

    case 'APPEND_TOKEN': {
      const idx = state.messages.findIndex(m => m.id === state.streamingId);
      if (idx === -1) return state;
      const updated = [...state.messages];
      updated[idx] = { ...updated[idx], content: updated[idx].content + action.token };
      return { ...state, messages: updated };
    }

    case 'FINALIZE_STREAM': {
      const idx = state.messages.findIndex(m => m.id === state.streamingId);
      const updated = [...state.messages];
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          content: action.response,
          suggestions: action.suggestions,
        };
      }
      return {
        ...state,
        isStreaming: false,
        streamingId: null,
        suggestions: action.suggestions?.length > 0 ? action.suggestions : state.suggestions,
        messages: updated,
      };
    }

    case 'STREAM_ERROR': {
      const idx = state.messages.findIndex(m => m.id === state.streamingId);
      const updated = [...state.messages];
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], content: '⚠️ Failed to get a response. Please try again.' };
      }
      return { ...state, isStreaming: false, streamingId: null, messages: updated };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
  }, []);

  const initChat = useCallback(async () => {
    try {
      const res = await fetch(`${AI_URL}/chat/init`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      dispatch({ type: 'INIT_SUCCESS', welcomeMessage: data.welcomeMessage, suggestions: data.suggestions });
    } catch {
      dispatch({ type: 'INIT_SUCCESS', welcomeMessage: 'Hi! I can help you analyze your cloud costs. What would you like to know?', suggestions: [] });
    }
  }, [getHeaders]);

  const sendMessage = useCallback(async (message) => {
    if (!message?.trim() || state.isStreaming) return;

    dispatch({ type: 'ADD_USER_MSG', content: message });

    const msgId = genId();
    dispatch({ type: 'START_STREAM', id: msgId });

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${AI_URL}/chat/message/stream`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        dispatch({ type: 'STREAM_ERROR' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'token') {
              dispatch({ type: 'APPEND_TOKEN', token: event.token });
            } else if (event.type === 'done') {
              dispatch({ type: 'FINALIZE_STREAM', response: event.response, suggestions: event.suggestions });
            } else if (event.type === 'error') {
              dispatch({ type: 'STREAM_ERROR' });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') dispatch({ type: 'STREAM_ERROR' });
    }
  }, [state.isStreaming, getHeaders]);

  const resetChat = useCallback(async () => {
    try {
      await fetch(`${AI_URL}/chat/reset`, { method: 'POST', headers: getHeaders() });
    } catch {}
    dispatch({ type: 'RESET' });
  }, [getHeaders]);

  const open  = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const close = useCallback(() => dispatch({ type: 'CLOSE' }), []);
  const toggle = useCallback(() => dispatch({ type: 'TOGGLE' }), []);

  return (
    <ChatContext.Provider value={{ ...state, initChat, sendMessage, resetChat, open, close, toggle }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};
