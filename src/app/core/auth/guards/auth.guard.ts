import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ParseUser } from 'app/core/user/parse-user.model';
import { defaultNavigation } from 'app/core/navigation/navigation.data';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
    return this.check(redirectUrl);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
    return this.check(redirectUrl);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.check('/');
  }

  private check(redirectURL: string): Observable<boolean> {

    const user = ParseUser.current() as ParseUser;

    if (!user) {

      this.router.navigate(['sign-in'], {
        queryParams: { redirectURL }
      });
      return of(false);

    } else {

      if (user.isAdmin() && !['/dashboard', '/settings'].includes(redirectURL)) {

        const moduleName = redirectURL.split('/')[1];

        const navItem = defaultNavigation.find(item => item.link === '/' + moduleName);

        const hasPermission = user.permissions?.includes(navItem?.id);

        if (!hasPermission) {
          this.router.navigate(['dashboard']);
          return of(false);
        }
      }
    }

    return of(true);
  }
}
