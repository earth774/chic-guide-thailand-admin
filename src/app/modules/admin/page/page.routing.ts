import { Route } from '@angular/router';
import { PageComponent } from 'app/modules/admin/page/page.component';
import { PageListComponent } from 'app/modules/admin/page/list/list.component';
import { PageDetailComponent } from 'app/modules/admin/page/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: PageComponent,
    children: [
      {
        path: '',
        component: PageListComponent,
        children: [
          {
            path: ':id',
            component: PageDetailComponent,
          }
        ]
      }
    ]
  }
];
