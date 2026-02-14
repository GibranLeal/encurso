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

/**
 * Normaliza campos que vienen del backend (modulos)
 * - id, nombre, ruta, icono, grupo, orden, modulo_padre_id
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

  // Dashboard EXACTO
  if (path === "/app") return pathname === "/app" || pathname === "/app/";

  // Para el resto: activo si coincide exacto o es prefijo /subruta
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

function MenuNode({ node, level = 0 }) {
  const { pathname } = useLocation();

  const label = node.label ?? "Módulo";
  const path = node.path ?? "#";
  const icon = node.icon ?? null;

  const hasChildren = node.children?.length > 0;
  const pad = 14 + level * 12;

  const childActive = hasActiveDescendant(node, pathname);

  // ✅ Open por defecto si algún hijo está activo
  const [open, setOpen] = useState(childActive);

  // ✅ Si cambias de ruta y un hijo queda activo, abrimos automáticamente
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium",
            childActive ? "bg-neutral-100 text-neutral-900" : "text-neutral-800 hover:bg-neutral-100",
          ].join(" ")}
          style={{ paddingLeft: pad }}
        >
          <IconFA icon={icon} className="text-neutral-700" />
          <span className="flex-1 truncate">{label}</span>
          <i
            className={`fa-solid ${
              open ? "fa-chevron-down" : "fa-chevron-right"
            } text-xs text-neutral-400`}
          />
        </button>

        {open && (
          <div className="mt-1 space-y-1">
            {node.children.map((c) => (
              <MenuNode key={c.id} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      end={path === "/app"} // ✅ Dashboard exacto, evita que se quede “activo” en /app/*.
      className={({ isActive }) =>
        [
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium",
          isActive ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-800 hover:bg-neutral-100",
        ].join(" ")
      }
      style={{ paddingLeft: pad }}
    >
      {({ isActive }) => (
        <>
          <IconFA icon={icon} className={isActive ? "text-white" : "text-neutral-700"} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  // ✅ En vez de useMemo([]) lo guardamos en state para que pueda actualizarse
  const [rawModules, setRawModules] = useState(() => getModulesFromStorage());

  // ✅ Listener para refrescar cuando ModulosPage guarda/actualiza
  useEffect(() => {
    const onUpdate = () => setRawModules(getModulesFromStorage());
    window.addEventListener("encurso:menu-updated", onUpdate);
    return () => window.removeEventListener("encurso:menu-updated", onUpdate);
  }, []);

  const tree = useMemo(() => buildTree(rawModules), [rawModules]);
  const grouped = useMemo(() => groupBy(tree), [tree]);

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 px-2 py-2">
        <img src="/img/identidad/encurso.png" alt="Encurso" className="h-8 w-auto" />
        <div className="text-sm font-semibold tracking-tight text-neutral-900">Encurso</div>
      </div>

      <div className="mt-4 space-y-6">
        {grouped.map(([groupName, items]) => (
          <div key={groupName}>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {groupName}
            </div>

            <div className="space-y-1">
              {items.map((node) => (
                <MenuNode key={node.id} node={node} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
