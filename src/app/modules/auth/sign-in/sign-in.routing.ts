import { Route } from '@angular/router';
import { AuthSignInComponent } from 'app/modules/auth/sign-in/sign-in.component';

export const routes: Route[] = [
  {
    path: '',
    component: AuthSignInComponent
  }
];
