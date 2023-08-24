import { Route } from '@angular/router';
import { PackageComponent } from 'app/modules/admin/package/package.component';
import { PackageListComponent } from 'app/modules/admin/package/list/list.component';
import { PackageDetailComponent } from 'app/modules/admin/package/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: PackageComponent,
    children: [
      {
        path: '',
        component: PackageListComponent,
        children: [
          {
            path: ':id',
            component: PackageDetailComponent,
          }
        ]
      }
    ]
  }
];
