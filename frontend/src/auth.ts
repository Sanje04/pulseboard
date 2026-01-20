import { apiRequest } from "./api";

// Interface for login response
export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
}

// Function to handle user login
export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Function to handle user logout
export function logout() {
  localStorage.removeItem("accessToken");
}

// Function to save access token
export function saveToken(token: string) {
  localStorage.setItem("accessToken", token);
}
