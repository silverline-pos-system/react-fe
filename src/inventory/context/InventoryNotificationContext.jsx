/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const InventoryNotificationContext = createContext();

export const useInventoryNotification = () => {
    const context = useContext(InventoryNotificationContext);
    if (!context) {
        throw new Error('useInventoryNotification must be used within InventoryNotificationProvider');
    }
    return context;
};

export const InventoryNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type, duration };

        setNotifications(prev => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    const success = useCallback((message, duration) => {
        showNotification(message, 'success', duration);
    }, [showNotification]);

    const error = useCallback((message, duration) => {
        showNotification(message, 'error', duration);
    }, [showNotification]);

    const warning = useCallback((message, duration) => {
        showNotification(message, 'warning', duration);
    }, [showNotification]);

    const info = useCallback((message, duration) => {
        showNotification(message, 'info', duration);
    }, [showNotification]);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [promptDialog, setPromptDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, placeholder: '' });

    const confirm = useCallback((title, message, type = 'danger') => {
        return new Promise((resolve) => {
            setConfirmDialog({
                isOpen: true,
                title,
                message,
                type,
                onConfirm: () => resolve(true)
            });
        });
    }, []);

    const prompt = useCallback((title, message, placeholder = '') => {
        return new Promise((resolve) => {
            setPromptDialog({
                isOpen: true,
                title,
                message,
                placeholder,
                onConfirm: (value) => resolve(value)
            });
        });
    }, []);

    const closeConfirmDialog = useCallback(() => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    }, []);

    const closePromptDialog = useCallback(() => {
        setPromptDialog({ isOpen: false, title: '', message: '', onConfirm: null, placeholder: '' });
    }, []);

    return (
        <InventoryNotificationContext.Provider
            value={{
                notifications,
                showNotification,
                removeNotification,
                success,
                error,
                warning,
                info,
                confirm,
                prompt,
                confirmDialog,
                promptDialog,
                closeConfirmDialog,
                closePromptDialog
            }}
        >
            {children}
        </InventoryNotificationContext.Provider>
    );
};
