"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function DeleteConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  deleting = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
      onClick={() => !deleting && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-full bg-[var(--color-maroon)]/10 flex items-center justify-center">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-[var(--color-maroon)] text-lg"
            />
          </div>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5 disabled:opacity-40"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
          {title}
        </h3>
        <p className="font-body text-sm text-[var(--color-ink)]/60 mt-2">
          {message}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--color-maroon)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
            {deleting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
