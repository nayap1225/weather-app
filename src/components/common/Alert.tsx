import React from "react";

interface AlertProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  onConfirm: () => void;
}

export default function Alert({
  isOpen,
  title = "알림",
  message,
  confirmText = "확인",
  onConfirm,
}: AlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onConfirm}
      ></div>
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ℹ️
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
