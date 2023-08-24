import { NgModule } from '@angular/core';
import { PlaceListComponent } from './list/list.component';
import { PlaceDetailComponent } from './detail/detail.component';
import { routes } from 'app/modules/admin/place/place.routing';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { PlaceComponent } from './place.component';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { QuillModule } from 'ngx-quill';
import { GoogleMapsModule } from '@angular/google-maps';
import { FilePondModule, registerPlugin } from 'ngx-filepond';

// import and register filepond file type validation plugin
import * as FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
registerPlugin(FilePondPluginFileValidateType);

@NgModule({
  declarations: [
    PlaceComponent,
    PlaceListComponent,
    PlaceDetailComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    DragDropModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    FuseFindByKeyPipeModule,
    QuillModule,
    GoogleMapsModule,
    FilePondModule,
    SharedModule,
  ]
})
export class PlaceModule { }
