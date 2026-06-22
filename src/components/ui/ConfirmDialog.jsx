import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { Button } from './button';

const VARIANTS = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    confirmLabel: 'Delete',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    confirmLabel: 'Confirm',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    confirmLabel: 'Confirm',
  },
};

export function ConfirmDialog({ open, title, message, confirmLabel, variant = 'danger', onConfirm, onCancel }) {
  if (!open) return null;
  const v = VARIANTS[variant] || VARIANTS.danger;
  const Icon = v.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${v.iconBg}`}>
          <Icon className={`h-6 w-6 ${v.iconColor}`} />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          {message && <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <button
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${v.confirmClass}`}
            onClick={onConfirm}
          >
            {confirmLabel || v.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
