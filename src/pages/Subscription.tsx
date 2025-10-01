// src/screens/OrdersList.tsx
import React, { useEffect, useState } from "react";
import localStorageService, { Order } from "../services/localStorage";

type OrdersListProps = {
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
};

const OrdersList: React.FC<OrdersListProps> = ({ onNavigate, onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(localStorageService.getOrders());
    // If you expect orders to change live, consider subscribing or polling
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Orders</h2>
        <div className="flex gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate("dashboard")}
              className="px-3 py-1 rounded bg-gray-100 text-sm"
            >
              Dashboard
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1 rounded bg-gray-100 text-sm"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-sm text-gray-500">No orders yet.</div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="border rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">#{order.tokenDisplay || order.id}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 capitalize">{order.status || "pending"}</div>
              </div>

              <div className="mt-3">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>{it.name} × {it.quantity}</div>
                    <div className="font-medium">{it.price * it.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">{order.paymentMethod.toUpperCase()}</div>
                <div className="font-semibold">Total: {order.total}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersList;
