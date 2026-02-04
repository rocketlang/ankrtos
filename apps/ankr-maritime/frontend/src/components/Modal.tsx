import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={ref}
        className="relative bg-maritime-800 border border-maritime-600 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-maritime-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-maritime-400 hover:text-white text-lg">
            &#x2715;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-maritime-400 mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';

export const selectClass = inputClass;

export const textareaClass =
  'w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-vertical';

export const btnPrimary =
  'bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50';

export const btnSecondary =
  'bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm font-medium px-4 py-2 rounded-md transition-colors';
