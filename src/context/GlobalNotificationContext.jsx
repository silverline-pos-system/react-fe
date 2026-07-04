/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalNotificationContext = createContext();

export const useGlobalNotification = () => {
    const context = useContext(GlobalNotificationContext);
    if (!context) {
        throw new Error('useGlobalNotification must be used within GlobalNotificationProvider');
    }
    return context;
};

export const GlobalNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'danger',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });
    const [promptDialog, setPromptDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        placeholder: '',
        confirmText: 'Submit',
        cancelText: 'Cancel'
    });

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

    const success = useCallback((message, duration = 4000) => {
        showNotification(message, 'success', duration);
    }, [showNotification]);

    const error = useCallback((message, duration = 5000) => {
        showNotification(message, 'error', duration);
    }, [showNotification]);

    const warning = useCallback((message, duration = 4000) => {
        showNotification(message, 'warning', duration);
    }, [showNotification]);

    const info = useCallback((message, duration = 4000) => {
        showNotification(message, 'info', duration);
    }, [showNotification]);

    const confirm = useCallback((title, message, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel') => {
        return new Promise((resolve) => {
            setConfirmDialog({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => resolve(true)
            });
        });
    }, []);

    const prompt = useCallback((title, message, placeholder = '', confirmText = 'Submit', cancelText = 'Cancel') => {
        return new Promise((resolve) => {
            setPromptDialog({
                isOpen: true,
                title,
                message,
                placeholder,
                confirmText,
                cancelText,
                onConfirm: (value) => resolve(value)
            });
        });
    }, []);

    const closeConfirmDialog = useCallback(() => {
        setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            type: 'danger',
            confirmText: 'Confirm',
            cancelText: 'Cancel'
        });
    }, []);

    const closePromptDialog = useCallback(() => {
        setPromptDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            placeholder: '',
            confirmText: 'Submit',
            cancelText: 'Cancel'
        });
    }, []);

    return (
        <GlobalNotificationContext.Provider
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
        </GlobalNotificationContext.Provider>
    );
};
