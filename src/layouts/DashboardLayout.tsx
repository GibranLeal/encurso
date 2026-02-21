import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../shared/ui/Sidebar";
import Topbar from "../shared/ui/Topbar";

// Lee estado colapsado guardado
function readCollapsed(): boolean {
  try {
    const saved = localStorage.getItem("encurso_sidebar_collapsed");
    return saved ? Boolean(JSON.parse(saved)) : false;
  } catch {
    return false;
  }
}

export function DashboardLayout() {
  // ✅ Estado global del sidebar (para que el layout reaccione y el main se recorra)
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);

  // ✅ Detectar mobile (lg <= 1024px)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    window.matchMedia("(max-width: 1024px)").matches
  );

  // ✅ Drawer state para mobile (abrir/cerrar)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Detecta cambios de tamaño (responsive)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");

    const onChange = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);

      // En mobile: colapsamos para que no ocupe y cerramos drawer
      if (mobile) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };

    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Persistimos collapsed aquí (una sola fuente de verdad)
  useEffect(() => {
    localStorage.setItem("encurso_sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen w-full bg-[#f5f6fa]">
      <div className="flex min-h-screen w-full gap-6 p-6">
        {/* ✅ Wrapper del sidebar: ahora SI cambia de ancho */}
        <div
          className={[
            "shrink-0 transition-all duration-200",
            isMobile ? "w-0" : collapsed ? "w-[80px]" : "w-[300px]",
          ].join(" ")}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
            isMobile={isMobile}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>

        {/* Área principal */}
        <div className="min-w-0 flex-1">
          <Topbar isMobile={isMobile} onOpenSidebar={() => setMobileOpen(true)} />

          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}