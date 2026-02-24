import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import RequireAuth from "../auth/RequireAuth";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { HomePage } from "../../pages/HomePage";
import { ModulosPage } from "../../pages/ModulosPage";
import { UsuariosPage } from "../../pages/UsuariosPage";
import PermisosPage from "../../pages/PermisosPage";
import PlanesPage from "../../pages/PlanesPage";
import RolesPage from "../../pages/RolesPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    element: <RequireAuth />, 
    children: [
      {
        path: "/app",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <HomePage /> },        
          { path: "modulos", element: <ModulosPage /> }, 
          { path: "usuarios", element: <UsuariosPage /> },
          { path: "permisos", element: <PermisosPage /> },
          { path: "planes", element: <PlanesPage /> },
          { path: "roles", element: <RolesPage /> },
          // después: usuarios, permisos, etc...
        ],
      },
    ],
  },

  { path: "*", element: <LoginPage /> },
]);
