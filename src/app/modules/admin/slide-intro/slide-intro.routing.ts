import { Route } from '@angular/router';
import { SlideIntroComponent } from 'app/modules/admin/slide-intro/slide-intro.component';
import { SlideIntroListComponent } from 'app/modules/admin/slide-intro/list/list.component';
import { SlideIntroDetailComponent } from 'app/modules/admin/slide-intro/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: SlideIntroComponent,
    children: [
      {
        path: '',
        component: SlideIntroListComponent,
        children: [
          {
            path: ':id',
            component: SlideIntroDetailComponent,
          }
        ]
      }
    ]
  }
];
