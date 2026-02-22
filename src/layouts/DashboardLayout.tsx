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
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    window.matchMedia("(max-width: 1024px)").matches
  );

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");

    const onChange = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);

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

  useEffect(() => {
    localStorage.setItem("encurso_sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen w-full bg-[#f5f6fa]">
      <div className="flex min-h-screen w-full gap-6 p-6">
        {/* Wrapper del sidebar */}
        <div
          className={[
            "shrink-0 transition-all duration-200",
            "sticky top-6 self-start", // ✅ fijo tipo sticky
            "h-[calc(100vh-48px)]",     // ✅ altura visible (48px = top-6 + bottom-6 aprox)
            isMobile ? "w-0" : collapsed ? "w-[80px]" : "w-[300px]",
          ].join(" ")}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
            isMobile={isMobile}
            mobileOpen={mobileOpen}
            onOpenMobile={() => setMobileOpen(true)}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>

        {/* Área principal */}
        <div className="min-w-0 flex-1">
          {/* ✅ Ya NO mandamos onOpenSidebar para que no haya hamburguesa */}
          <Topbar isMobile={isMobile} />

          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}