import React, { useEffect, useRef } from 'react';
import useEscapeClose from '../../hooks/useEscapeClose';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, isAlert = false }) {
  useEscapeClose(onCancel);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
      <div className="bg-white w-80 rounded-lg shadow-2xl overflow-hidden transform transition-all scale-100">
        <div className="p-5 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isAlert ? 'bg-green-100' : 'bg-yellow-100'}`}>
            {isAlert ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            )}
          </div>
          <h3 className="text-lg leading-6 font-bold text-slate-900">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-slate-500 whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:text-sm ${isAlert ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isAlert ? 'OK' : 'Yes, Proceed'}
          </button>

          {!isAlert && (
            <button onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:text-sm">
              No
            </button>
          )}
        </div>
      </div>
    </div>
  );
}