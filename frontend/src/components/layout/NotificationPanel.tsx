import { useNavigate } from "react-router-dom";
import { XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "@/contexts/NotificationContext";
import type { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";

export function NotificationPanel() {
  const { panelOpen, notifications, togglePanel, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
    }
    togglePanel();
    if (n.link_url) {
      navigate(n.link_url);
    }
  };

  if (!panelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={togglePanel}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-96 transform bg-white shadow-2xl transition-transform"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <button
              type="button"
              onClick={togglePanel}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
                <BellIcon className="h-12 w-12" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span
                        className={n.is_read ? "invisible" : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{n.title}</p>
                        <p className="text-sm text-slate-500">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
