import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";

const ORDER_EVENTS = ["order.created", "order.updated", "order.payment.updated"];

export const useLiveOrderSync = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    if (user.restroId) {
      socket.emit("restaurant.subscribe", { restaurantId: user.restroId });
    }

    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    };

    for (const eventName of ORDER_EVENTS) {
      socket.on(eventName, handleUpdate);
    }

    return () => {
      for (const eventName of ORDER_EVENTS) {
        socket.off(eventName, handleUpdate);
      }
    };
  }, [queryClient, user]);
};
