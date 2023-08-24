import { Route } from '@angular/router';
import { CategoryComponent } from 'app/modules/admin/category/category.component';
import { CategoryListComponent } from 'app/modules/admin/category/list/list.component';
import { CategoryDetailComponent } from 'app/modules/admin/category/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: CategoryComponent,
    children: [
      {
        path: '',
        component: CategoryListComponent,
        children: [
          {
            path: ':id',
            component: CategoryDetailComponent,
          }
        ]
      }
    ]
  }
];
