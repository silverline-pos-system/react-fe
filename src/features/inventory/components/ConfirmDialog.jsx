import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    useEscapeClose(onClose, isOpen);
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            icon: 'text-yellow-600',
            iconBg: 'bg-yellow-100',
            button: 'bg-yellow-600 hover:bg-yellow-700'
        },
        info: {
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const styles = typeStyles[type] || typeStyles.danger;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4 p-6 pb-4">
                    <div className={`${styles.iconBg} p-3 rounded-full flex-shrink-0`}>
                        <AlertTriangle className={styles.icon} size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PromptDialog = ({ isOpen, onClose, onConfirm, title, message, placeholder = '', confirmText = 'Submit', cancelText = 'Cancel' }) => {
    useEscapeClose(onClose, isOpen);
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (value.trim()) {
            onConfirm(value);
            onClose();
            setValue('');
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        {message}
                    </p>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        autoFocus
                    />
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!value.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { ConfirmDialog, PromptDialog };
