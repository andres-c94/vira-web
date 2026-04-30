import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        void router.navigate(['/login']);
      }

      const message =
        typeof error.error?.message === 'string'
          ? error.error.message
          : error.status === 404
            ? 'No se encontró el recurso solicitado.'
            : error.status === 409
              ? 'La acción no se puede completar en el estado actual.'
              : 'Ocurrió un error inesperado.';

      return throwError(() => new Error(message));
    })
  );
};
