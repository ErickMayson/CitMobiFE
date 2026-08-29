import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

/** Functional Interceptor for provideHttpClient(withInterceptors) */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const token = loginService.getToken();
  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        const hasRefreshToken = !!loginService.getRefreshToken();

        if (req.url.includes('/v1/auth/refresh')) {
          loginService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        if (hasRefreshToken) {
          return loginService.refreshToken().pipe(
            switchMap(() => {
              const newToken = loginService.getToken();
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              loginService.logout();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          loginService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};

/** Class-based Interceptor for DI providers */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.loginService.getToken();
    let authReq = request;
    if (token && !request.headers.has('Authorization')) {
      authReq = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          const hasRefreshToken = !!this.loginService.getRefreshToken();

          if (request.url.includes('/v1/auth/refresh')) {
            this.loginService.logout();
            this.router.navigate(['/login']);
            return throwError(() => error);
          }

          if (hasRefreshToken && !this.isRefreshing) {
            this.isRefreshing = true;
            return this.loginService.refreshToken().pipe(
              switchMap(() => {
                this.isRefreshing = false;
                const newToken = this.loginService.getToken();
                const retryReq = request.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                });
                return next.handle(retryReq);
              }),
              catchError((refreshError) => {
                this.isRefreshing = false;
                this.loginService.logout();
                this.router.navigate(['/login']);
                return throwError(() => refreshError);
              })
            );
          } else {
            this.loginService.logout();
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
