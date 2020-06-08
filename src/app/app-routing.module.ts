import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { FavorFeedsPageModule } from './pages/favorite/favorite.module';
import { FeedContentPageModule } from './pages/favorite/content/content.module';
import { ExplorePageModule } from './pages/favorite/search/search.module';
import { FeedAboutPageModule } from './pages/favorite/search/about/about.module';

// const routes: Routes = [
//   { path: '', redirectTo: 'home', pathMatch: 'full' },
//   { path: 'initialize', loadChildren: './pages/initialize/initialize.module#InitializePageModule' },

//   { path: 'favorite', loadChildren: () => FavorFeedsPageModule },
//   { path: 'favorite/content/:nodeId/:name/:id/:ownerName', loadChildren: () => FeedContentPageModule },
//   { path: 'favorite/search', loadChildren: () =>  ExplorePageModule },
//   { path: 'favorite/search/about/:nodeId/:name/:id', loadChildren: () => FeedAboutPageModule },

//   /* lazy loading: myfeeds */
//   { path: 'menu', redirectTo: 'menu/myfeeds', pathMatch: 'full' },
//   { path: 'menu/myfeeds', loadChildren: './pages/myfeeds/myfeeds.module#MyfeedsPageModule' },
//   { path: 'menu/myfeeds/board/:nodeId/:id/:name', loadChildren: './pages/myfeeds/board/board.module#FeedBoardPageModule' },
//   { path: 'menu/myfeeds/create', loadChildren: './pages/myfeeds/create/create-feed.module#CreateFeedPageModule' },
//   { path: 'menu/myfeeds/newevent/:nodeId/:topic', loadChildren: './pages/myfeeds/board/newevent/newevent.module#NeweventPageModule' },

//   /* lazy loading: carrier servers */
  // { path: 'menu/servers', loadChildren: './pages/servers/servers.module#ServersPageModule' },
  // { path: 'menu/servers/server-info/:did', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  // { path: 'menu/servers/add-server/:address', loadChildren: './pages/servers/add-server/add-server.module#AddServerPageModule'},
  // { path: 'menu/servers/add-server/scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' },

//   /* lazy loading: about this dApp */
//   { path: 'menu/about', loadChildren: './pages/about/about.module#AboutPageModule' },

//   /* lazy loading: myprofile */
//   { path: 'menu/myprofile', loadChildren: './pages/myprofile/myprofile.module#MyprofilePageModule' },
//   { path: 'scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' },
//   { path: 'home', loadChildren: './pages/home/home.module#HomePageModule' },
//   { path: 'detail/:nodeId/:channelId/:postId', loadChildren: './pages/detail/detail.module#DetailPageModule' },
  

// ];

const routes: Routes = [
  { path: '', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'feeds', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'splashscreen', loadChildren: './pages/splashscreen/splashscreen.module#SplashscreenPageModule' },

  { path: 'menu/servers', loadChildren: './pages/servers/servers.module#ServersPageModule' },
  { path: 'menu/servers/server-info/:did', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/add-server/:address', loadChildren: './pages/servers/add-server/add-server.module#AddServerPageModule'},
  { path: 'menu/servers/add-server/scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' },

  { path: 'signin', loadChildren: './pages/signin/signin.module#SigninPageModule' },

  { path: 'menu/myfeeds/create', loadChildren: './pages/myfeeds/create/create-feed.module#CreateFeedPageModule' },
  { path: 'createnewfeed', loadChildren: './pages/feeds/createnewfeed/createnewfeed.module#CreatenewfeedPageModule' },
  { path: 'createnewpost/:nodeId/:channelId', loadChildren: './pages/feeds/createnewpost/createnewpost.module#CreatenewpostPageModule' },

  { path: 'bindservice/scanqrcode', loadChildren: './pages/feeds/bindservice/scanqrcode/scanqrcode.module#ScanqrcodePageModule' },
  { path: 'bindservice/importdid/:nodeId', loadChildren: './pages/feeds/bindservice/importdid/importdid.module#ImportdidPageModule' },
  { path: 'bindservice/publishdid/:nodeId/:did/:payload', loadChildren: './pages/feeds/bindservice/publishdid/publishdid.module#PublishdidPageModule' },
  { path: 'bindservice/issuecredential/:nodeId/:did', loadChildren: './pages/feeds/bindservice/issuecredential/issuecredential.module#IssuecredentialPageModule' },
  { path: 'bindservice/finish', loadChildren: './pages/feeds/bindservice/finish/finish.module#FinishPageModule' },
  { path: 'bindservice/startbinding/:nodeId/:nonce', loadChildren: './pages/feeds/bindservice/startbinding/startbinding.module#StartbindingPageModule' },
  // { path: 'feeds/tabs/channels', loadChildren: './home/channels/channels.module#ChannelsPageModule' },
  // /feeds/tabs/channels

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
