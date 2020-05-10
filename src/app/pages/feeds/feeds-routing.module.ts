import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
            loadChildren: './home/home.module#HomePageModule'
          },
          { 
            path: 'channels/:nodeId/:channelId', 
            loadChildren: './home/channels/channels.module#ChannelsPageModule' 
          },
          { 
            path: 'postdetail/:nodeId/:channelId/:postId', 
            loadChildren: './home/postdetail/postdetail.module#PostdetailPageModule' 
          },
        ]
      },
      // 2nd Tab
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadChildren: './profile/profile.module#ProfilePageModule'
          },
          // {
          //   path: ':dappId',
          //   loadChildren: './home/home.module#HomePageModule'
          // }
        ]
      },
      // 3rd Tab
      {
        path: 'notification',
        children: [
          {
            path: '',
            loadChildren: './notification/notification.module#NotificationPageModule'
          },
          // {
          //   path: ':categoryType',
          //   loadChildren: './home/home.module#HomePageModule'
          // }
        ]
      },
      // 4th Tab
      {
        path: 'search',
        children: [
          {
            path: '',
            loadChildren: './search/search.module#SearchPageModule'
          },
        ]
      },

      // add 
      // {
      //   path: 'add',
      //   children: [
      //     {
      //       path: '',
      //       loadChildren: './search/search.module#SearchPageModule'
      //     },
      //   ]
      // },
        // Default Tab
      {
        path: '',
        redirectTo: '/feeds/tabs/home',
        pathMatch: 'full'
      },
    ]
  },
  {
    path: '',
    redirectTo: './home/home.module#HomePageModule',
    pathMatch: 'full'
  },
  // { path: 'channels', loadChildren: './home/channels/channels.module#ChannelsPageModule' },
  { path: 'createnewfeed', loadChildren: './createnewfeed/createnewfeed.module#CreatenewfeedPageModule' },
  { path: 'createnewpost', loadChildren: './createnewpost/createnewpost.module#CreatenewpostPageModule' },
  // { path: 'profile', loadChildren: './profile/profile.module#ProfilePageModule' },
  // { path: 'notification', loadChildren: './notification/notification.module#NotificationPageModule' },
  // { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  // { path: 'search', loadChildren: './search/search.module#SearchPageModule' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FeedsRoutingModule {}
