import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const routes: Route[] = [

  // Redirect empty path to '/dashboard'
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Redirect signed in user to the '/dashboard'
  //
  // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
  // path. Below is another redirection for that path to redirect the user to the desired
  // location. This is a small convenience to keep all main routes together here on this file.
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

  // Auth routes for guests
  {
    path: '',
    canActivate: [NoAuthGuard],
    canActivateChild: [NoAuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'empty'
    },
    children: [
      {
        path: 'forgot-password',
        loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.module').then(m => m.AuthForgotPasswordModule)
      },
      {
        path: 'sign-in',
        loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.AuthSignInModule)
      },
    ]
  },

  // Auth routes for authenticated users
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'empty'
    },
    children: [
      {
        path: 'sign-out',
        loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule)
      },
    ]
  },

  // Admin routes
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('app/modules/admin/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'users',
        data: {
          type: 'admin'
        },
        loadChildren: () => import('app/modules/admin/user/user.module').then(m => m.UserModule)
      },
      {
        path: 'customers',
        data: {
          type: 'customer'
        },
        loadChildren: () => import('app/modules/admin/user/user.module').then(m => m.UserModule)
      },
      {
        path: 'categories',
        loadChildren: () => import('app/modules/admin/category/category.module').then(m => m.CategoryModule)
      },
      {
        path: 'posts',
        loadChildren: () => import('app/modules/admin/post/post.module').then(m => m.PostModule)
      },
      {
        path: 'pages',
        loadChildren: () => import('app/modules/admin/page/page.module').then(m => m.PageModule)
      },
      {
        path: 'slider-images',
        loadChildren: () => import('app/modules/admin/slider-image/slider-image.module').then(m => m.SliderImageModule)
      },
      {
        path: 'slides-intro',
        loadChildren: () => import('app/modules/admin/slide-intro/slide-intro.module').then(m => m.SlideIntroModule)
      },
      {
        path: 'packages',
        loadChildren: () => import('app/modules/admin/package/package.module').then(m => m.PackageModule)
      },
      {
        path: 'user-packages',
        loadChildren: () => import('app/modules/admin/user-package/user-package.module').then(m => m.UserPackageModule)
      },
      {
        path: 'places',
        loadChildren: () => import('app/modules/admin/place/place.module').then(m => m.PlaceModule)
      },
      {
        path: 'reviews',
        loadChildren: () => import('app/modules/admin/review/review.module').then(m => m.ReviewModule)
      },
      {
        path: 'notifications',
        loadChildren: () => import('app/modules/admin/notification/notification.module').then(m => m.NotificationModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('app/modules/admin/settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'app-config',
        loadChildren: () => import('app/modules/admin/app-config/app-config.module').then(m => m.AppConfigModule)
      },
    ]
  }
];
