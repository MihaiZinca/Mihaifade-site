export const TOKEN_KEY = "mihaifade_token";
export const ROLE_KEY = "mihaifade_role";

export type UserRole = "CLIENT" | "BARBER" | "OWNER";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
    const role = localStorage.getItem(ROLE_KEY);

    if (
        role === "CLIENT" ||
        role === "BARBER" ||
        role === "OWNER"
    ) {
        return role;
    }

    return null;
}

export function isAuthenticated() {
    return Boolean(getToken());
}

export function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function saveRole(role: UserRole) {
    localStorage.setItem(ROLE_KEY, role);
}

export function removeRole() {
    localStorage.removeItem(ROLE_KEY);
}

export function saveAuth(
    token: string,
    role: UserRole
) {
    saveToken(token);
    saveRole(role);
}

export function logout() {
    removeToken();
    removeRole();
}
