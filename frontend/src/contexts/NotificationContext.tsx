import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Notification } from "@/types";
import { notificationApi } from "@/services/api";

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  panelOpen: boolean;
  togglePanel: () => void;
  markRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotifContext = createContext<NotifState>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  panelOpen: false,
  togglePanel: () => {},
  markRead: async () => {},
  refetch: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationApi.list(1);
      setNotifications(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const togglePanel = () => setPanelOpen((v) => !v);

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, loading, panelOpen, togglePanel, markRead, refetch: fetchNotifications }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
