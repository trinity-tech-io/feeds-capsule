import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FeedsPage } from './feeds.page';

const routes: Routes = [
  {
    path: 'tabs', // Bottom Tab Navigation
    component: FeedsPage,
    children: [
      // 1st Tab
      {
        path: 'home',
        children: [
          {
            path: '',
            loadChildren: './home/home.module#HomePageModule',
          },
        ],
      },
      // 2nd Tab
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadChildren: './profile/profile.module#ProfilePageModule',
          },
        ],
      },
      // 3rd Tab
      {
        path: 'notification',
        children: [
          {
            path: '',
            loadChildren:
              './notification/notification.module#NotificationPageModule',
          },
        ],
      },
      // 4th Tab
      {
        path: 'search',
        children: [
          {
            path: '',
            loadChildren: './pages/feeds/search/search.module#SearchPageModule',
          },
        ],
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [TranslateModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedsRoutingModule {}
