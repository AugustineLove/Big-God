import React, { createContext, useContext, useEffect, useState } from 'react';

// Account interface (adjust to match your actual account structure)
interface Notification {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
  customer_id: string;
  // Add more fields as needed
}

interface NotificationsContextType {
  notifications: Notification[];
  loading: boolean;
  refreshNotifications: (customerId: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within an NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (customerId: string) => {
    setLoading(true);
    try {
        console.log('Fetching Notifications for customer ID:', customerId);
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/Notifications/customer/${customerId}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch Notifications:', errorText);
        return;
      }
      const data = await res.json();
      console.log('Fetched Notifications:', data);
      setNotifications(data.data);
    } catch (error) {
      console.error('Error fetching Notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, loading, refreshNotifications: fetchNotifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
