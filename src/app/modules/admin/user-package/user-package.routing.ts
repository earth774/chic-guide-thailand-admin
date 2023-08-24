import { Route } from '@angular/router';
import { UserPackageComponent } from 'app/modules/admin/user-package/user-package.component';
import { UserPackageListComponent } from 'app/modules/admin/user-package/list/list.component';

export const routes: Route[] = [
  {
    path: '',
    component: UserPackageComponent,
    children: [
      {
        path: '',
        component: UserPackageListComponent,
        children: []
      }
    ]
  }
];
