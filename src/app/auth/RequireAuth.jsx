import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../../features/auth/auth.store";

export default function RequireAuth() {
  const token = getToken();
  // debug:
  console.log("RequireAuth token:", token);

  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
