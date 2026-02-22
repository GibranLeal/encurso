import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMediaBlobUrl } from "../../features/media/media.api";
import { fetchMe } from "../../features/auth/me.api";

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("encurso_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Topbar({ isMobile = false }) {
  const storedUser = useMemo(() => getUserFromStorage(), []);

  const [me, setMe] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  function logout() {
    localStorage.removeItem("encurso_token");
    localStorage.removeItem("encurso_user");
    localStorage.removeItem("encurso_modules");
    localStorage.removeItem("encurso_permissions");
    window.location.href = "/login";
  }

  // Cerrar menú al click fuera
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      const target = e.target;
      if (target && !menuRef.current.contains(target)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Cargar usuario real + avatar privado
  useEffect(() => {
    let cancelled = false;
    let prevUrl = "";

    (async () => {
      try {
        const user = await fetchMe();
        if (cancelled) return;

        setMe(user);

        if (user?.foto_media_id) {
          const url = await fetchMediaBlobUrl(Number(user.foto_media_id));
          if (cancelled) return;

          if (prevUrl && String(prevUrl).startsWith("blob:")) {
            try {
              URL.revokeObjectURL(prevUrl);
            } catch {}
          }

          prevUrl = url;
          setAvatarUrl(url);
        } else {
          setAvatarUrl("");
        }
      } catch {
        setMe(null);
        setAvatarUrl("");
      }
    })();

    return () => {
      cancelled = true;
      if (prevUrl && String(prevUrl).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch {}
      }
    };
  }, []);

  const fullName = me
    ? [me.nombre, me.apellido_paterno || "", me.apellido_materno || ""]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    : storedUser?.name ?? "Usuario";

  const email = me?.email ?? storedUser?.email ?? "";

  return (
    <header className="flex items-center justify-between gap-3">
      {/* Izquierda */}
      <div className="min-w-0">
        <div className="text-xs text-neutral-500 truncate">Dashboard / Home</div>
        <div className="text-xl font-semibold tracking-tight text-neutral-900 truncate">
          Home
        </div>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-2">
        {!isMobile && (
          <div className="hidden md:block">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-sm text-neutral-500" />
              <input
                className="w-72 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                placeholder="Search"
              />
            </div>
          </div>
        )}

        <button className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50">
          <i className="fa-solid fa-bell text-neutral-700" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50">
          <i className="fa-solid fa-gear text-neutral-700" />
        </button>

        {isMobile ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-2 shadow-sm hover:bg-neutral-50"
              aria-label="Abrir menú de usuario"
              title="Usuario"
            >
              <div className="h-9 w-9 overflow-hidden rounded-full border border-neutral-200 bg-neutral-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-500">
                    <i className="fa-solid fa-user" />
                  </div>
                )}
              </div>
              <i className="fa-solid fa-chevron-down text-xs text-neutral-500 pr-1" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg z-50">
                <div className="px-4 py-3">
                  <div className="text-sm font-semibold text-neutral-900 truncate">
                    {fullName}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">{email}</div>
                </div>
                <div className="border-t border-neutral-200" />
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-neutral-200 bg-neutral-200">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-500">
                  <i className="fa-solid fa-user" />
                </div>
              )}
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold text-neutral-900">{fullName}</div>
              <div className="text-[11px] text-neutral-500">{email}</div>
            </div>

            <button
              onClick={logout}
              className="ml-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}