import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function getModulesFromStorage() {
  try {
    const raw = localStorage.getItem("encurso_modules");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function normalizeModule(m) {
  return {
    id: m.id,
    label: m.label ?? m.nombre ?? "Módulo",
    path: m.path ?? m.ruta ?? "#",
    icon: m.icon ?? m.icono ?? null,
    group: m.group ?? m.grupo ?? m.etiqueta ?? "GENERAL",
    order: m.order ?? m.orden ?? 9999,
    parentId:
      m.parentId ??
      m.parent_id ??
      m.modulo_padre_id ??
      m.modulo_padre ??
      null,
    children: [],
  };
}

function buildTree(modules) {
  const map = new Map();
  const roots = [];

  modules.forEach((m) => {
    const n = normalizeModule(m);
    map.set(n.id, n);
  });

  for (const n of map.values()) {
    if (n.parentId && map.has(n.parentId)) map.get(n.parentId).children.push(n);
    else roots.push(n);
  }

  const sortRec = (arr) => {
    arr.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    arr.forEach((x) => sortRec(x.children));
  };
  sortRec(roots);

  return roots;
}

function groupBy(items) {
  const groups = new Map();
  items.forEach((item) => {
    const g = String(item.group ?? "GENERAL").toUpperCase();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(item);
  });
  return [...groups.entries()];
}

function IconFA({ icon, className = "" }) {
  const cls = icon ? `fa-solid ${icon}` : "fa-solid fa-circle";
  return <i className={`${cls} text-[14px] ${className}`} />;
}

function isPathActive(pathname, path) {
  if (!path || path === "#") return false;
  if (path === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname === path || pathname.startsWith(path + "/");
}

function hasActiveDescendant(node, pathname) {
  if (!node?.children?.length) return false;
  for (const c of node.children) {
    const p = c.path ?? "#";
    if (isPathActive(pathname, p)) return true;
    if (hasActiveDescendant(c, pathname)) return true;
  }
  return false;
}

function MenuNode({ node, level = 0, collapsed = false }) {
  const { pathname } = useLocation();

  const label = node.label ?? "Módulo";
  const path = node.path ?? "#";
  const icon = node.icon ?? null;
  const hasChildren = node.children?.length > 0;

  const pad = collapsed ? 10 : 14 + level * 12;
  const childActive = hasActiveDescendant(node, pathname);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  useEffect(() => {
    if (collapsed) setOpen(false);
  }, [collapsed]);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium",
            childActive
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-800 hover:bg-neutral-100",
          ].join(" ")}
          style={{ paddingLeft: pad }}
          title={collapsed ? label : undefined}
        >
          <IconFA icon={icon} className="text-neutral-700" />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && (
            <i
              className={`fa-solid ${
                open ? "fa-chevron-down" : "fa-chevron-right"
              } text-xs text-neutral-400`}
            />
          )}
        </button>

        {!collapsed && open && (
          <div className="mt-1 space-y-1">
            {node.children.map((c) => (
              <MenuNode
                key={c.id}
                node={c}
                level={level + 1}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      end={path === "/app"}
      className={({ isActive }) =>
        [
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium",
          isActive
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-800 hover:bg-neutral-100",
        ].join(" ")
      }
      style={{ paddingLeft: pad }}
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <IconFA
            icon={icon}
            className={isActive ? "text-white" : "text-neutral-700"}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapsed = () => {},
  isMobile = false,
  mobileOpen = false,
  onOpenMobile = () => {},
  onCloseMobile = () => {},
}) {
  const [rawModules, setRawModules] = useState(() => getModulesFromStorage());

  useEffect(() => {
    const onUpdate = () => setRawModules(getModulesFromStorage());
    window.addEventListener("encurso:menu-updated", onUpdate);
    return () => window.removeEventListener("encurso:menu-updated", onUpdate);
  }, []);

  const tree = useMemo(() => buildTree(rawModules), [rawModules]);
  const grouped = useMemo(() => groupBy(tree), [tree]);

  const asideBase = [
    "relative rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden",
    collapsed ? "p-3 w-[80px] min-w-[80px]" : "p-4 w-72 min-w-[288px]",
    "transition-all duration-200",
  ].join(" ");

  // ✅ MOBILE: drawer (overlay + panel que entra/sale)
  if (isMobile) {
    return (
      <>
        {/* ✅ Botón flotante propio del Sidebar (NO hamburguesa en Topbar) */}
        {!mobileOpen && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="fixed left-6 top-6 z-50 grid h-12 w-12 place-items-center rounded-2xl border border-neutral-200 bg-white shadow-lg hover:bg-neutral-50"
            aria-label="Abrir menú"
            title="Abrir menú"
          >
            <i className="fa-solid fa-chevron-right text-neutral-700" />
          </button>
        )}

        {/* Overlay */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          />
        )}

        {/* Panel */}
        <aside
          className={[
            "fixed left-6 top-6 z-50",
            asideBase,
            "transform transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-[120%]",
          ].join(" ")}
        >
          {/* ✅ Botón cerrar (opcional pero útil) */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute right-1 top-3 grid h-9 w-9 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <i className="fa-solid fa-xmark text-neutral-700" />
          </button>

          {/* Pestaña para colapsar/expandir (tu botón propio) */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute -right-1 top-16 z-10 flex h-10 w-6 items-center justify-center rounded-r-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <i
              className={[
                "fa-solid text-[12px] text-neutral-600",
                collapsed ? "fa-chevron-right" : "fa-chevron-left",
              ].join(" ")}
            />
          </button>

          {/* Branding */}
          <div className="flex items-center gap-3 px-2 py-2 pr-10">
            <img
              src="/img/identidad/encurso.png"
              alt="Encurso"
              className="h-8 w-auto"
            />
            {!collapsed && (
              <div className="text-sm font-semibold tracking-tight text-neutral-900">
                Encurso
              </div>
            )}
          </div>

          {/* Menú */}
          <div className="mt-4 space-y-6">
            {grouped.map(([groupName, items]) => (
              <div key={groupName}>
                {!collapsed && (
                  <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {groupName}
                  </div>
                )}

                <div className="space-y-1">
                  {items.map((node) => (
                    <MenuNode key={node.id} node={node} collapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </>
    );
  }

  // ✅ DESKTOP
  return (
    <aside className={asideBase + " h-full overflow-y-auto"}>
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute -right-1 top-16 z-10 flex h-10 w-6 items-center justify-center  border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <i
          className={[
            "fa-solid text-[12px] text-neutral-600",
            collapsed ? "fa-chevron-right" : "fa-chevron-left",
          ].join(" ")}
        />
      </button>

      <div className="flex items-center gap-3 px-2 py-2">
        <img
          src="/img/identidad/encurso.png"
          alt="Encurso"
          className="h-8 w-auto"
        />
        {!collapsed && (
          <div className="text-sm font-semibold tracking-tight text-neutral-900">
            Encurso
          </div>
        )}
      </div>

      <div className="mt-4 space-y-6">
        {grouped.map(([groupName, items]) => (
          <div key={groupName}>
            {!collapsed && (
              <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {groupName}
              </div>
            )}

            <div className="space-y-1">
              {items.map((node) => (
                <MenuNode key={node.id} node={node} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

