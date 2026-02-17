import { useEffect, useMemo, useState } from "react";
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

export default function Topbar() {
  const storedUser = useMemo(() => getUserFromStorage(), []);

  const [me, setMe] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  function logout() {
    localStorage.removeItem("encurso_token");
    localStorage.removeItem("encurso_user");
    localStorage.removeItem("encurso_modules");
    localStorage.removeItem("encurso_permissions");
    window.location.href = "/login";
  }

  // ✅ Cargar usuario real desde backend + avatar privado
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
      } catch (e) {
        // fallback: si falla /me, no rompemos la UI
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
    <header className="flex items-center justify-between">
      <div>
        <div className="text-xs text-neutral-500">Dashboard / Home</div>
        <div className="text-xl font-semibold tracking-tight text-neutral-900">
          Home
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <i className="fa-solid fa-magnifying-glass text-sm text-neutral-500" />
            <input
              className="w-72 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              placeholder="Search"
            />
          </div>
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50">
          <i className="fa-solid fa-bell text-neutral-700" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50">
          <i className="fa-solid fa-gear text-neutral-700" />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
          {/* Avatar */}
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

          {/* Nombre + email */}
          <div className="leading-tight">
            <div className="text-sm font-semibold text-neutral-900">
              {fullName}
            </div>
            <div className="text-[11px] text-neutral-500">{email}</div>
          </div>

          <button
            onClick={logout}
            className="ml-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
