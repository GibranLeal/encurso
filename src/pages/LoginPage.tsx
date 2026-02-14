import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@encurso.mx");
  const [password, setPassword] = useState("Admin123*");

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  try {
    const resp = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      toast.error(data?.message ?? "Credenciales inválidas");
      return;
    }

    // tu backend regresa { token }
    localStorage.setItem("encurso_token", data.token);

    // opcional (pero recomendado): traer /me para tener user, módulos y permisos
    const meResp = await fetch("http://localhost:4000/auth/me", {
      headers: { Authorization: `Bearer ${data.token}` },
    });

    const meData = await meResp.json();

    if (!meResp.ok) {
      toast.error(meData?.message ?? "No se pudo cargar tu sesión");
      return;
    }

    localStorage.setItem("encurso_user", JSON.stringify(meData.user));
    localStorage.setItem("encurso_modules", JSON.stringify(meData.modules));
    localStorage.setItem("encurso_permissions", JSON.stringify(meData.permissionsEffective));

    toast.success("Bienvenido ✅");
    window.location.href = "/app";
  } catch {
    toast.error("No se pudo conectar al servidor");
  }
}


  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* LEFT */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center gap-3">
              <img src="../public/img/identidad/encurso.png" alt="Encurso" className="h-9 w-auto"/>

              <div className="text-sm font-semibold tracking-tight">Encurso</div>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Log in
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Accede a tu dashboard
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
                onClick={() => toast.message("Luego conectamos Google")}
              >
                <span className="inline-block h-4 w-4 rounded-full bg-neutral-900" />
                Iniciar sesión con Google
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
                onClick={() => toast.message("Luego conectamos GitHub")}
              >
                <span className="inline-block h-4 w-4 rounded-full bg-neutral-900" />
                Iniciar sesión con Facebook
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <div className="text-xs font-medium text-neutral-400">O</div>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-200/60"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Contraseña
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-200/60"
                  placeholder="Password"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 active:bg-neutral-950"
              >
                Continuar
              </button>

              <p className="pt-2 text-center text-xs text-neutral-500">
                No tienes cuenta?{" "}
                <a className="font-semibold text-neutral-900 underline underline-offset-4" href="#">
                  Creala aquí
                </a>
              </p>
            </form>

            <p className="mt-8 text-[11px] text-neutral-400 text-center">
              Administrador | Proveedor | Participante
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative hidden lg:flex items-center justify-center bg-transparent">
          
          {/* contenedor con margen interno (espacio transparente) */}
          <div className="w-full h-full p-8">
            
            {/* panel degradado */}
            <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-sky-200 via-indigo-200 to-amber-200 shadow-inner">

              {/* buscador flotante */}
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-lg backdrop-blur">
                <input
                  className="w-72 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
                  placeholder="Pregúntale a Encurso..."
                />
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white"
                  onClick={() => toast.message("UI demo")}
                >
                  ↑
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
