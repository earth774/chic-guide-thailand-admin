import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ParseUser } from '../user/parse-user.model';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() { }

  /**
   * Intercept
   *
   * @param req
   * @param next
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request object
    let newReq = req.clone();

    // Response
    return next.handle(newReq).pipe(
      catchError((error) => {

        // Catch session expired
        if (error instanceof HttpErrorResponse && error.status === 209) {

          ParseUser.logOut().then(() => {
            location.reload();
          });

        }

        return throwError(() => new Error(error));
      })
    );
  }
}
