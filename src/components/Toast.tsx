'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

export type ToastType = 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    // Mark as exiting first (for exit animation)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Then remove after animation duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType, action?: ToastAction) => {
      const id = ++nextId;
      setToasts((prev) => [
        ...prev.slice(-2), // keep at most 3 visible (add to end, trim oldest)
        { id, message, type, exiting: false, action },
      ]);

      // Auto-dismiss after 5s if there is an action, else 3s
      const duration = action ? 5000 : 3000;
      const timer = setTimeout(() => {
        removeToast(id);
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — bottom-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '320px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const isSuccess = toast.type === 'success';

  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
    background: isSuccess ? '#D1FAE5' : '#FEE2E2',
    color: isSuccess ? '#065F46' : '#991B1B',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    pointerEvents: 'all',
    cursor: 'default',
  };

  return (
    <div
      role="status"
      className={toast.exiting ? 'toast-exit' : 'toast-enter'}
      style={style}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
            border: '1px solid var(--color-border, #E5E7EB)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: '8px',
            marginRight: '4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            pointerEvents: 'all',
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          color: 'inherit',
          opacity: 0.7,
          fontSize: '16px',
          lineHeight: 1,
          flexShrink: 0,
          minWidth: '20px',
          minHeight: '20px',
        }}
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
