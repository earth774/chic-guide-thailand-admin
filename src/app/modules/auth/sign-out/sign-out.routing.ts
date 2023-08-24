import { Route } from '@angular/router';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';

export const routes: Route[] = [
  {
    path: '',
    component: AuthSignOutComponent
  }
];
