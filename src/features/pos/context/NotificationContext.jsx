/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pos_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const list = (parsed.list || []).map(n => ({
          ...n,
          time: new Date(n.time)
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotifications(list);
        setUnreadCount(parsed.unread || 0);
      } catch (e) {
        console.error("Failed to load notifications", e);
      }
    }
    // Mark as initialized AFTER loading
    setInitialized(true);
  }, []);

  // Save to localStorage whenever notifications change (only after initialization)
  useEffect(() => {
    if (!initialized) return; // Don't save until we've loaded
    localStorage.setItem('pos_notifications', JSON.stringify({
      list: notifications,
      unread: unreadCount
    }));
  }, [notifications, unreadCount, initialized]);

  // Add notification to history and show toast
  const addNotification = useCallback((type, title, message) => {
    const id = Date.now();
    const newNotif = { id, type, title, message, time: new Date(), read: false };

    // Add to history
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      return updated.slice(0, 50); // Limit to 50
    });
    setUnreadCount(prev => prev + 1);

    // Add to toast stack
    setToasts(prev => [...prev.slice(-2), newNotif]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Mark all notifications as read
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear notification history
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('pos_notifications');
  };

  // Mark single notification as read
  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      const unread = updated.filter(n => !n.read).length;
      setUnreadCount(unread);
      return updated;
    });
  };

  // Remove single notification
  const removeNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      const unread = updated.filter(n => !n.read).length;
      setUnreadCount(unread);
      return updated;
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isOpen,
      setIsOpen,
      addNotification,
      markAllRead,
      clearNotifications,
      markAsRead,
      removeNotification
    }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-in slide-in-from-right fade-in duration-300 pointer-events-auto bg-white border border-slate-200 shadow-2xl rounded-lg p-4 w-80 flex items-start gap-3 border-l-4"
            style={{ borderLeftColor: toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? '#EF4444' : '#3B82F6' }}>

            <div className={`mt-0.5 ${toast.type === 'success' ? 'text-green-500' : toast.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">{toast.title}</h4>
              <p className="text-slate-500 text-xs mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
