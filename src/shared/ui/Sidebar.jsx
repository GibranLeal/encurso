import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

/**
 * Lee el menú desde localStorage.
 * Esto lo alimentas desde tu backend (módulos) y lo guardas en "encurso_modules".
 */
function getModulesFromStorage() {
  try {
    const raw = localStorage.getItem("encurso_modules");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Normaliza campos que pueden venir con nombres distintos del backend:
 * - id, nombre/label, ruta/path, icono/icon, grupo/group, orden/order, modulo_padre_id/parentId...
 * Esto te permite soportar distintos formatos sin romper el frontend.
 */
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

/**
 * Convierte la lista plana de módulos en un árbol:
 * - Si tiene parentId, se vuelve hijo del padre
 * - Si no tiene parentId, es "root"
 * También ordena por "order".
 */
function buildTree(modules) {
  const map = new Map();
  const roots = [];

  // 1) Creamos nodos normalizados y los metemos al map por id
  modules.forEach((m) => {
    const n = normalizeModule(m);
    map.set(n.id, n);
  });

  // 2) Conectamos hijos con padres
  for (const n of map.values()) {
    if (n.parentId && map.has(n.parentId)) map.get(n.parentId).children.push(n);
    else roots.push(n);
  }

  // 3) Ordenamos roots e hijos recursivamente por "order"
  const sortRec = (arr) => {
    arr.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    arr.forEach((x) => sortRec(x.children));
  };
  sortRec(roots);

  return roots;
}

/**
 * Agrupa módulos por "group" (GENERAL, CONFIGURACIÓN, etc.)
 * Regresa un array tipo: [ ["GENERAL", [items...]], ["CONFIG", [items...]] ]
 */
function groupBy(items) {
  const groups = new Map();

  items.forEach((item) => {
    const g = String(item.group ?? "GENERAL").toUpperCase();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(item);
  });

  return [...groups.entries()];
}

/**
 * Render simple de FontAwesome.
 * Si no hay icono, ponemos un fallback.
 */
function IconFA({ icon, className = "" }) {
  const cls = icon ? `fa-solid ${icon}` : "fa-solid fa-circle";
  return <i className={`${cls} text-[14px] ${className}`} />;
}

/**
 * Determina si una ruta se considera activa.
 * - Dashboard "/app" es exacto
 * - Para el resto: exacto o prefijo (/ruta/*)
 */
function isPathActive(pathname, path) {
  if (!path || path === "#") return false;

  if (path === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname === path || pathname.startsWith(path + "/");
}

/**
 * Revisa si un nodo tiene algún descendiente activo.
 * Esto se usa para abrir automáticamente el "acordeón" del padre.
 */
function hasActiveDescendant(node, pathname) {
  if (!node?.children?.length) return false;

  for (const c of node.children) {
    const p = c.path ?? "#";
    if (isPathActive(pathname, p)) return true;
    if (hasActiveDescendant(c, pathname)) return true;
  }
  return false;
}

/**
 * Nodo del menú.
 * Puede ser:
 * - "padre": tiene children => renderiza botón + subitems
 * - "hoja": no tiene children => renderiza NavLink
 *
 * Props:
 * - collapsed: si true, solo iconos
 * - level: indentación por jerarquía
 */
function MenuNode({ node, level = 0, collapsed = false }) {
  const { pathname } = useLocation();

  const label = node.label ?? "Módulo";
  const path = node.path ?? "#";
  const icon = node.icon ?? null;

  const hasChildren = node.children?.length > 0;

  // Padding por nivel, pero si está colapsado lo reducimos
  const pad = collapsed ? 10 : 14 + level * 12;

  // Saber si algún hijo está activo (para abrir el acordeón)
  const childActive = hasActiveDescendant(node, pathname);

  // Estado local para abrir/cerrar el acordeón del nodo
  const [open, setOpen] = useState(childActive);

  // Si cambia la ruta y un hijo queda activo, abrimos automático
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // Si está colapsado, cerramos acordeones para que no se haga largo
  useEffect(() => {
    if (collapsed) setOpen(false);
  }, [collapsed]);

  // ---- PADRE (tiene hijos) ----
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

  // ---- HOJA (sin hijos) ----
  return (
    <NavLink
      to={path}
      end={path === "/app"} // Dashboard exacto
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

/**
 * Sidebar principal
 *
 * Props (las manda DashboardLayout):
 * - collapsed (bool)
 * - onToggleCollapsed (fn)
 * - isMobile (bool)
 * - mobileOpen (bool) -> si el drawer está abierto (mobile)
 * - onCloseMobile (fn) -> para cerrar el drawer (click overlay)
 */
export default function Sidebar({
  collapsed = false,
  onToggleCollapsed = () => {},
  isMobile = false,
  mobileOpen = false,
  onCloseMobile = () => {},
}) {
  // Cargamos módulos desde storage y escuchamos "encurso:menu-updated"
  const [rawModules, setRawModules] = useState(() => getModulesFromStorage());

  useEffect(() => {
    const onUpdate = () => setRawModules(getModulesFromStorage());
    window.addEventListener("encurso:menu-updated", onUpdate);
    return () => window.removeEventListener("encurso:menu-updated", onUpdate);
  }, []);

  // Armamos árbol y grupos
  const tree = useMemo(() => buildTree(rawModules), [rawModules]);
  const grouped = useMemo(() => groupBy(tree), [tree]);

  // Estilos de la tarjeta sidebar
  const asideBase = [
    "relative rounded-2xl border border-neutral-200 bg-white shadow-sm",
    collapsed ? "p-3 w-20" : "p-4 w-72",
    "transition-all duration-200",
  ].join(" ");

  // ✅ MOBILE: drawer (overlay + panel que entra/sale)
  if (isMobile) {
    return (
      <>
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
          {/* Pestaña para colapsar/expandir */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute -right-3 top-16 z-10 flex h-10 w-6 items-center justify-center rounded-r-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
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
                    <MenuNode
                      key={node.id}
                      node={node}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </>
    );
  }

  // ✅ DESKTOP: normal (sin overlay)
  return (
    <aside className={asideBase}>
      {/* Pestaña para colapsar/expandir */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-16 z-10 flex h-10 w-6 items-center justify-center rounded-r-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
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
  );
}