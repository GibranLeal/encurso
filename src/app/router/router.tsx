import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import RequireAuth from "../auth/RequireAuth";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { HomePage } from "../../pages/HomePage";
import { ModulosPage } from "../../pages/ModulosPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    element: <RequireAuth />, // protege lo de abajo
    children: [
      {
        path: "/app",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <HomePage /> },        // /app
          { path: "modulos", element: <ModulosPage /> }, // /app/modulos ✅
          // después: usuarios, permisos, etc...
        ],
      },
    ],
  },

  { path: "*", element: <LoginPage /> },
]);
