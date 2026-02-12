import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import { RequireAuth } from "./RequireAuth";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { HomePage } from "../../pages/HomePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [{ path: "", element: <HomePage /> }],
  },
  { path: "*", element: <LoginPage /> },
]);
