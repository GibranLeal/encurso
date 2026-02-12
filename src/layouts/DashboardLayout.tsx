import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 280, borderRight: "1px solid #eee", padding: 16 }}>
        <div style={{ fontWeight: 700 }}>Encurso</div>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>Menú (dinámico)</div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
