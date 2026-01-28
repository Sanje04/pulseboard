import { api } from "./api";

export async function login(email: string, password: string) {
  return api<{ accessToken: string; user: { id: string; name: string; email: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function signup(name: string, email: string, password: string) {
  return api<{ accessToken?: string; user?: { id: string; name: string; email: string } }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify({ name, email, password }) }
  );
}

export function saveToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function logout() {
  localStorage.removeItem("accessToken");
}
