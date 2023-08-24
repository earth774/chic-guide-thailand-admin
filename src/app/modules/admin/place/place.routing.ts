import { Route } from '@angular/router';
import { PlaceComponent } from 'app/modules/admin/place/place.component';
import { PlaceListComponent } from 'app/modules/admin/place/list/list.component';
import { PlaceDetailComponent } from 'app/modules/admin/place/detail/detail.component';

export const routes: Route[] = [
  {
    path: '',
    component: PlaceComponent,
    children: [
      {
        path: '',
        component: PlaceListComponent,
        children: [
          {
            path: ':id',
            component: PlaceDetailComponent,
          }
        ]
      }
    ]
  }
];
