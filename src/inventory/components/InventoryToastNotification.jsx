import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useInventoryNotification } from '../context/InventoryNotificationContext';
import { ConfirmDialog, PromptDialog } from './ConfirmDialog';

const InventoryToastNotification = () => {
    const { notifications, removeNotification, confirmDialog, promptDialog, closeConfirmDialog, closePromptDialog } = useInventoryNotification();

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
                                    {/* Icon */}
                                    <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                                        <IconComponent size={20} strokeWidth={2.5} />
                                    </div>

                                    {/* Message */}
                                    <div className={`flex-1 ${styles.text} text-sm font-medium leading-relaxed`}>
                                        {notification.message}
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => removeNotification(notification.id)}
                                        className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Progress Bar */}
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
            />

            <PromptDialog
                isOpen={promptDialog.isOpen}
                onClose={closePromptDialog}
                onConfirm={promptDialog.onConfirm || (() => { })}
                title={promptDialog.title}
                message={promptDialog.message}
                placeholder={promptDialog.placeholder}
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

export default InventoryToastNotification;
