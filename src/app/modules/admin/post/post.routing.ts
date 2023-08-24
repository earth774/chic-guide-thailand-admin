import { Route } from '@angular/router';
import { PostComponent } from 'app/modules/admin/post/post.component';
import { PostListComponent } from 'app/modules/admin/post/list/list.component';
import { PostDetailComponent } from 'app/modules/admin/post/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: PostComponent,
    children: [
      {
        path: '',
        component: PostListComponent,
        children: [
          {
            path: ':id',
            component: PostDetailComponent,
          }
        ]
      }
    ]
  }
];
