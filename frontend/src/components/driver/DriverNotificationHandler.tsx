import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import IncomingOrderNotification from './IncomingOrderNotification';
import orderService from '@/services/api/orderService';
import { toast } from 'sonner';

import { useQueryClient } from '@tanstack/react-query';

const DriverNotificationHandler: React.FC = () => {
  const { subscribe } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentOffer, setCurrentOffer] = useState<unknown>(null);

  useEffect(() => {
    if (!user || user.role !== 'DRIVER') return;
    const subscription = subscribe('/user/queue/notifications', async (message: unknown) => {
      if (message.type === 'ORDER_OFFER' || message.type === 'ORDER_ASSIGNED') {
        queryClient.invalidateQueries({ queryKey: ['driver'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });

        if (message.order) {
          setCurrentOffer(message.order);
        } else if (message.orderId) {
          try {
            const orderDetails = await orderService.getOrderById(message.orderId);
            setCurrentOffer(orderDetails);
          } catch (error) {
            console.error("Failed to fetch order details for notification:", error);
          }
        }
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [user, subscribe]);

  const handleAccept = async (orderId: string) => {
    try {
      await orderService.acceptOrder(orderId);
      toast.success("Mission acceptée !");
      setCurrentOffer(null);
      
      // Invalidate queries to refresh UI without full page reload
      queryClient.invalidateQueries({ queryKey: ['driver'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (error: unknown) {
      toast.error(error.response?.data?.message || "Erreur lors de l'acceptation");
      setCurrentOffer(null);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await orderService.refuseOrder(orderId);
      toast.info("Mission ignorée");
    } catch (error) {
      console.error("Erreur lors du rejet de la mission:", error);
    } finally {
      setCurrentOffer(null);
    }
  };

  if (!currentOffer) return null;

  return (
    <IncomingOrderNotification 
      order={currentOffer}
      onAccept={handleAccept}
      onReject={handleReject}
      timeoutSeconds={30}
      variant="fullscreen"
    />
  );
};

export default DriverNotificationHandler;
