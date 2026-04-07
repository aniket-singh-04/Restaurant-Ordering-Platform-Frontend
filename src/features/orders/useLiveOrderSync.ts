import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";

const ORDER_EVENTS = [
  "order.created",
  "order.updated",
  "order.payment.updated",
  "order.status.changed",
  "orders.updated",
  "table.occupancy.updated",
  "kitchen.status.updated",
];

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

    for (const branch of user.branchIds ?? []) {
      socket.emit("branch.subscribe", { branchId: branch._id });
    }

    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["tables"] });
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
