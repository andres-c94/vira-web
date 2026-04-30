import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthResponse, LoginPayload, RegisterPayload } from '../models/auth.models';
import { User } from '../models/user.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = environment.apiUrl;
  private readonly userState = signal<User | null>(this.readStoredUser());
  readonly user = computed(() => this.userState());

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.auth.register}`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.auth.login}`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}${API_ENDPOINTS.auth.me}`).pipe(
      tap((user) => this.setCurrentUser(user))
    );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.tokenService.removeUser();
    this.userState.set(null);
  }

  isAuthenticated(): boolean {
    return Boolean(this.tokenService.getToken());
  }

  setCurrentUser(user: User): void {
    this.userState.set(user);
    this.tokenService.setUser(JSON.stringify(user));
  }

  private persistSession(response: AuthResponse): void {
    this.tokenService.setToken(response.accessToken);
    this.setCurrentUser(response.user);
  }

  private readStoredUser(): User | null {
    const rawUser = this.tokenService.getUser();
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      this.tokenService.removeUser();
      return null;
    }
  }
}
