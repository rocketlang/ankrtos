/**
 * Toast Notification System
 *
 * Displays real-time notifications for intelligence updates.
 * Auto-dismisses after 5 seconds with slide-in animation.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, Clock, FileText, Ship } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message, icon: <CheckCircle className="w-5 h-5" /> });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, icon: <AlertCircle className="w-5 h-5" /> });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message, icon: <Info className="w-5 h-5" /> });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message, icon: <AlertCircle className="w-5 h-5" /> });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getColorClasses = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getIconColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div
      className={`${getColorClasses(toast.type)} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div className="flex items-start gap-3">
        <div className={getIconColor(toast.type)}>{toast.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.message && <p className="text-xs mt-1 opacity-90">{toast.message}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Specific toast helpers for maritime events
export function useMaritimeToasts() {
  const toast = useToast();

  return {
    newArrival: (vesselName: string, portName: string) => {
      toast.addToast({
        type: 'info',
        title: 'New Arrival Detected',
        message: `${vesselName} → ${portName}`,
        icon: <Ship className="w-5 h-5" />,
        duration: 7000
      });
    },

    documentUploaded: (documentName: string) => {
      toast.success('Document Uploaded', documentName);
    },

    documentApproved: (documentName: string) => {
      toast.success('Document Approved', documentName);
    },

    etaChanged: (vesselName: string, newETA: string) => {
      toast.addToast({
        type: 'warning',
        title: 'ETA Updated',
        message: `${vesselName} - New ETA: ${newETA}`,
        icon: <Clock className="w-5 h-5" />,
        duration: 7000
      });
    },

    intelligenceUpdated: (vesselName: string) => {
      toast.info('Intelligence Updated', vesselName);
    }
  };
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
`;
document.head.appendChild(style);
