import React, { useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';
import { useNotification } from '@/features/pos/context/NotificationContext';

const NotificationPanel = () => {
    const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllRead, removeNotification, clearNotifications } = useNotification();

    // Handle escape key to dismiss panel
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, setIsOpen]);

    if (!isOpen) return null;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <Check className="text-green-600" size={20} />;
            case 'error':
                return <AlertCircle className="text-red-600" size={20} />;
            case 'warning':
                return <AlertCircle className="text-yellow-600" size={20} />;
            default:
                return <Info className="text-blue-600" size={20} />;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-end p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 animate-in slide-in-from-right-5 fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-gray-700" />
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={clearNotifications}
                                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                >
                                    Clear all
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[500px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-950">
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(notification.time)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(notification.id);
                                            }}
                                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
