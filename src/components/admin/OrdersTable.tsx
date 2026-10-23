"use client";
import { useRouter } from "next/navigation";
import { adminFetch } from "./client";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  total: string;
  createdAt: string;
  items: { id: string; name: string; sku: string; quantity: number; lineTotal: string }[];
}

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT = ["UNPAID", "PAID", "REFUNDED"];

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const update = async (id: string, body: Record<string, string>) => {
    if (body.status === "CANCELLED" && !confirm("Cancel this order? Stock will be returned to inventory.")) return router.refresh();
    const res = await adminFetch(`orders/${id}`, { method: "PATCH", body });
    if (!res.ok) alert(res.error);
    router.refresh();
  };
  if (orders.length === 0) return <p className="empty-state">No orders yet.</p>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.orderNumber}</strong>
                <div className="hint">{new Date(o.createdAt).toLocaleString("en-IN")}</div>
              </td>
              <td>
                {o.customerName}
                <div className="hint">
                  {o.phone}
                  {o.email ? ` · ${o.email}` : ""}
                  <br />
                  {[o.addressLine1, o.addressLine2, o.city, o.state, o.pincode].filter(Boolean).join(", ")}
                  {o.notes && (
                    <>
                      <br />
                      Note: {o.notes}
                    </>
                  )}
                </div>
              </td>
              <td>
                {o.items.map((i) => (
                  <div key={i.id}>
                    {i.name} × {i.quantity}
                  </div>
                ))}
              </td>
              <td>₹{o.total}</td>
              <td>
                <label className="visually-hidden" htmlFor={`st-${o.id}`}>
                  Status
                </label>
                <select id={`st-${o.id}`} defaultValue={o.status} disabled={o.status === "CANCELLED"} onChange={(e) => update(o.id, { status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <label className="visually-hidden" htmlFor={`pay-${o.id}`}>
                  Payment status
                </label>
                <select id={`pay-${o.id}`} defaultValue={o.paymentStatus} onChange={(e) => update(o.id, { paymentStatus: e.target.value })}>
                  {PAYMENT.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
