import { Outlet } from "react-router-dom";
import Sidebar from "../shared/ui/Sidebar";
import Topbar from "../shared/ui/Topbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-[#f5f6fa]">
      <div className="flex min-h-screen w-full gap-6 p-6">
        {/* Sidebar como tarjeta */}
        <div className="w-[300px] shrink-0">
          <Sidebar />
        </div>

        {/* Área principal sin borde */}
        <div className="min-w-0 flex-1">
          {/* topbar sin fondo (transparente) */}
          <Topbar />

          {/* contenido */}
          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
