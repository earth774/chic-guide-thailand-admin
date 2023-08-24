import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { routes } from 'app/modules/auth/sign-out/sign-out.routing';

@NgModule({
  declarations: [
    AuthSignOutComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    MatButtonModule,
    FuseCardModule,
    SharedModule,
  ]
})
export class AuthSignOutModule {
}
