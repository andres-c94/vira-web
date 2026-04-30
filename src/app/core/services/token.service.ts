import { Injectable } from '@angular/core';

const TOKEN_KEY = 'modo-aventura-token';
const USER_KEY = 'modo-aventura-user';

@Injectable({ providedIn: 'root' })
export class TokenService {
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  setUser(rawUser: string): void {
    localStorage.setItem(USER_KEY, rawUser);
  }

  getUser(): string | null {
    return localStorage.getItem(USER_KEY);
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }
}
