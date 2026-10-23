"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "./client";
import { errorText, TextField } from "./fields";

export function RedirectsManager({ rows }: { rows: { id: string; fromPath: string; toPath: string; createdAt: string }[] }) {
  const router = useRouter();
  const [fromPath, setFrom] = useState("");
  const [toPath, setTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const res = await adminFetch("redirects", { method: "POST", body: { fromPath, toPath } });
    setErrors(res.fieldErrors);
    setError(res.ok ? null : res.error);
    if (res.ok) {
      setFrom("");
      setTo("");
      router.refresh();
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this redirect?")) return;
    await adminFetch(`redirects/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <section className="admin-card">
        <h2>Add redirect</h2>
        <div className="two-col">
          <TextField label="From path" value={fromPath} onChange={setFrom} placeholder="/old-page/" error={errors.fromPath} />
          <TextField label="To path" value={toPath} onChange={setTo} placeholder="/oils/groundnut-oil/" error={errors.toPath} />
        </div>
        <button type="button" className="btn btn-primary btn-small" onClick={add}>
          Add redirect
        </button>
        {error && <p className="status-err">{errorText(error) ?? error}</p>}
      </section>
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.fromPath}</td>
                <td>{r.toPath}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <button type="button" className="link-button" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>No redirects yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
