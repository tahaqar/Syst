"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: "danger" | "warning" | "info" | string;
  loading?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = "تأكيد الحذف",
  cancelText = "إلغاء",
  isDestructive = true,
  type,
  loading = false,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const displayMessage = message || description || "";
  const isActuallyLoading = loading || isLoading;
  const isActuallyDestructive = isDestructive !== undefined ? isDestructive : type === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        <button
          onClick={onClose}
          disabled={isActuallyLoading}
          className="absolute top-4 end-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
              isActuallyDestructive
                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400"
                : "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isActuallyDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {displayMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isActuallyLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isActuallyLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer ${
              isActuallyDestructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isActuallyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
