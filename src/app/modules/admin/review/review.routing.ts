import { Route } from '@angular/router';
import { ReviewComponent } from 'app/modules/admin/review/review.component';
import { ReviewListComponent } from 'app/modules/admin/review/list/list.component';
import { ReviewDetailComponent } from 'app/modules/admin/review/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: ReviewComponent,
    children: [
      {
        path: '',
        component: ReviewListComponent,
        children: [
          {
            path: ':id',
            component: ReviewDetailComponent,
          }
        ]
      }
    ]
  }
];
