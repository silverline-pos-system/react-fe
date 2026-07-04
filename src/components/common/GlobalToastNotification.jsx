import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useGlobalNotification } from '@/context/GlobalNotificationContext';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
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
    const [value, setValue] = React.useState('');

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

const GlobalToastNotification = () => {
    const { notifications, removeNotification, confirmDialog, promptDialog, closeConfirmDialog, closePromptDialog } = useGlobalNotification();

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    container: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
                    icon: 'text-green-600',
                    text: 'text-green-800',
                    progress: 'bg-green-500',
                    IconComponent: CheckCircle
                };
            case 'error':
                return {
                    container: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
                    icon: 'text-red-600',
                    text: 'text-red-800',
                    progress: 'bg-red-500',
                    IconComponent: XCircle
                };
            case 'warning':
                return {
                    container: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
                    icon: 'text-yellow-600',
                    text: 'text-yellow-800',
                    progress: 'bg-yellow-500',
                    IconComponent: AlertTriangle
                };
            case 'info':
            default:
                return {
                    container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
                    icon: 'text-blue-600',
                    text: 'text-blue-800',
                    progress: 'bg-blue-500',
                    IconComponent: Info
                };
        }
    };

    return (
        <>
            {/* Toast Notifications */}
            {notifications.length > 0 && (
                <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                    {notifications.map((notification) => {
                        const styles = getNotificationStyles(notification.type);
                        const IconComponent = styles.IconComponent;

                        return (
                            <div
                                key={notification.id}
                                className={`${styles.container} pointer-events-auto min-w-[320px] max-w-md border-l-4 rounded-lg shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300`}
                            >
                                <div className="p-4 flex items-start gap-3">
                                    <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                                        <IconComponent size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className={`flex-1 ${styles.text} text-sm font-medium leading-relaxed`}>
                                        {notification.message}
                                    </div>

                                    <button
                                        onClick={() => removeNotification(notification.id)}
                                        className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {notification.duration > 0 && (
                                    <div className="h-1 bg-white/30 rounded-b-lg overflow-hidden">
                                        <div
                                            className={`h-full ${styles.progress} animate-shrink-width`}
                                            style={{
                                                animation: `shrinkWidth ${notification.duration}ms linear forwards`
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Dialogs */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirmDialog}
                onConfirm={confirmDialog.onConfirm || (() => { })}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
            />

            <PromptDialog
                isOpen={promptDialog.isOpen}
                onClose={closePromptDialog}
                onConfirm={promptDialog.onConfirm || (() => { })}
                title={promptDialog.title}
                message={promptDialog.message}
                placeholder={promptDialog.placeholder}
                confirmText={promptDialog.confirmText}
                cancelText={promptDialog.cancelText}
            />

            <style>{`
                @keyframes shrinkWidth {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                .animate-shrink-width {
                    animation: shrinkWidth linear forwards;
                }
            `}</style>
        </>
    );
};

export default GlobalToastNotification;
