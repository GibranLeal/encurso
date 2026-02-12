export function getToken() {
  return localStorage.getItem("encurso_token");
}
export function setToken(token: string) {
  localStorage.setItem("encurso_token", token);
}
export function clearToken() {
  localStorage.removeItem("encurso_token");
}
