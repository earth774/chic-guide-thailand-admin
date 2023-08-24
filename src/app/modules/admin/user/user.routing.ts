import { Route } from '@angular/router';
import { UserComponent } from 'app/modules/admin/user/user.component';
import { UserListComponent } from 'app/modules/admin/user/list/list.component';
import { UserDetailComponent } from 'app/modules/admin/user/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: '',
        component: UserListComponent,
        children: [
          {
            path: ':id',
            component: UserDetailComponent,
          }
        ]
      }
    ]
  }
];
