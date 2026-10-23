import { OrdersTable, type AdminOrder } from "@/components/admin/OrdersTable";
import { adminGet } from "@/lib/admin-api";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const data = await adminGet<{ total: number; page: number; orders: AdminOrder[] }>(`/orders?page=${page}`);
  return (
    <>
      <h1>Orders ({data.total})</h1>
      <OrdersTable orders={data.orders} />
      <p className="inline-actions">
        {page > 1 && <a href={`/admin/orders/?page=${page - 1}`}>← Newer</a>}
        {page * 50 < data.total && <a href={`/admin/orders/?page=${page + 1}`}>Older →</a>}
      </p>
    </>
  );
}
