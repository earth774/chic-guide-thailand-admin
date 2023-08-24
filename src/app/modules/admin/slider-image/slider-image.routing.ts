import { Route } from '@angular/router';
import { SliderImageComponent } from 'app/modules/admin/slider-image/slider-image.component';
import { SliderImageListComponent } from 'app/modules/admin/slider-image/list/list.component';
import { SliderImageDetailComponent } from 'app/modules/admin/slider-image/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: SliderImageComponent,
    children: [
      {
        path: '',
        component: SliderImageListComponent,
        children: [
          {
            path: ':id',
            component: SliderImageDetailComponent,
          }
        ]
      }
    ]
  }
];
