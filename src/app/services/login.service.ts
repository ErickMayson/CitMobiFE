import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { LoginRequest } from '../models/login.model';
import { LoginResponse } from '../models/loginResponse.model';
import { JWTPayload } from '../models/JWTPayload.model';
import { environment } from '../../../environments/enviroment';
import { User } from '../models/userLiteResponse.model';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';
  private refreshThresholdMs = 60000;
  public currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getStoredUser()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /** Login user */
  login(login: string, senha: string): Observable<User> {
    const loginData: LoginRequest = { login, senha };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/v1/auth/login`, loginData)
      .pipe(
        switchMap((res) => {
          this.setToken(res.token);
          this.setRefreshToken(res.refreshToken);
          const decoded = this.decodeToken(res.token);
          if (!decoded?.sub) {
            return throwError(() => new Error('Invalid token'));
          }
          return this.getUserData(decoded.sub);
        }),
        map((user: User) => {
          this.setStoredUser(user);
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /** Fetch user data from API */
  private getUserData(login: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/v1/api/usuarios`, {
      headers: this.getAuthHeaders(),
      params: { login },
    });
  }

  /** Decode JWT token */
  private decodeToken(token: string): JWTPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JWTPayload;
    } catch {
      return null;
    }
  }

  /** Logout user */
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  /** Get authorization headers */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /** Get token safely */
  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  /** Store token safely */
  private setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  /** Get user from storage safely */
  private getStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const str = localStorage.getItem('currentUser');
    return str ? JSON.parse(str) : null;
  }

  /** Store user safely */
  private setStoredUser(user: User): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  /** Observable to refresh user from API */
  refreshUserData(): Observable<User> {
    const decoded = this.getDecodedToken();
    if (!decoded?.sub) {
      return throwError(() => new Error('No valid token found'));
    }
    return this.getUserData(decoded.sub).pipe(
      map((user) => {
        this.setStoredUser(user);
        this.currentUserSubject.next(user);
        return user;
      })
    );
  }

  /** Decode token from storage */
  getDecodedToken(): JWTPayload | null {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }

  /** Check if token expired */
  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded?.exp) return true;
    return new Date(decoded.exp * 1000) < new Date();
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /** Get current user snapshot */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /** Refresh access token using refresh token */
  refreshToken(): Observable<User> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/v1/auth/refresh`, { refreshToken })
      .pipe(
        switchMap((res) => {
          this.setToken(res.token);
          this.setRefreshToken(res.refreshToken);
          const decoded = this.decodeToken(res.token);
          if (!decoded?.sub) {
            return throwError(() => new Error('Invalid token'));
          }
          return this.getUserData(decoded.sub);
        }),
        map((user: User) => {
          this.setStoredUser(user);
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Refresh failed'));
        })
      );
  }

  /** Check if token is about to expire and refresh if needed */
  checkAndRefreshToken(): Observable<User | null> {
    const decoded = this.getDecodedToken();
    if (!decoded?.exp) {
      this.logout();
      return of(null);
    }

    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiry = expirationTime - Date.now();

    if (timeUntilExpiry <= this.refreshThresholdMs) {
      return this.refreshToken();
    }

    return of(this.currentUserValue);
  }

  /** Get refresh token safely */
  getRefreshToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  /** Store refresh token safely */
  private setRefreshToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.refreshTokenKey, token);
    }
  }
}
