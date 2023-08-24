import { Route } from '@angular/router';
import { NotificationComponent } from 'app/modules/admin/notification/notification.component';
import { NotificationListComponent } from 'app/modules/admin/notification/list/list.component';
import { NotificationDetailComponent } from 'app/modules/admin/notification/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: NotificationComponent,
    children: [
      {
        path: '',
        component: NotificationListComponent,
        children: [
          {
            path: ':id',
            component: NotificationDetailComponent,
          }
        ]
      }
    ]
  }
];
