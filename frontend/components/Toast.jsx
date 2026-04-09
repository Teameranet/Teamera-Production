import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import './Toast.css';

const ICONS = {
  warning: <AlertCircle size={20} />,
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
};

function ToastItem({ toast, onDismiss }) {
  const type = toast.type || 'info';

  useEffect(() => {
    if (toast.duration === 0) return; // manual dismiss only
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <div className={`toast__icon-wrap toast__icon-wrap--${type}`}>
        {ICONS[type]}
      </div>

      <div className="toast__body">
        {toast.title && <p className="toast__title">{toast.title}</p>}
        {toast.description && <p className="toast__description">{toast.description}</p>}
        {toast.action && (
          <button className="toast__action" onClick={toast.action.onClick}>
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
