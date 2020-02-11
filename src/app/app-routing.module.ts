import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { FavorFeedsPageModule } from './pages/favorite/favorite.module';
import { FeedContentPageModule } from './pages/favorite/content/content.module';
import { ExplorePageModule } from './pages/favorite/search/search.module';
import { FeedAboutPageModule } from './pages/favorite/search/about/about.module';

const routes: Routes = [
  { path: '', redirectTo: 'favorite', pathMatch: 'full' },
  { path: 'favorite', loadChildren: () => FavorFeedsPageModule },
  { path: 'favorite/content', loadChildren: () => FeedContentPageModule },
  { path: 'favorite/search', loadChildren: () =>  ExplorePageModule },
  { path: 'favorite/search/about', loadChildren: () => FeedAboutPageModule },

  /* lazy loading: myfeeds */
  { path: 'menu', redirectTo: 'menu/myfeeds', pathMatch: 'full' },
  { path: 'menu/myfeeds', loadChildren: './pages/myfeeds/myfeeds.module#MyfeedsPageModule' },
  { path: 'menu/myfeeds/board', loadChildren: './pages/myfeeds/board/board.module#FeedBoardPageModule' },
  { path: 'menu/myfeeds/create', loadChildren: './pages/myfeeds/create/create-feed.module#CreateFeedPageModule' },

  /* lazy loading: carrier servers */
  { path: 'menu/servers', loadChildren: './pages/servers/servers.module#ServersPageModule' },
  { path: 'menu/servers/server-info', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/add-server', loadChildren: './pages/servers/add-server/add-server.module#AddServerPageModule'},
  { path: 'menu/servers/add-server/scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' },

  /* lazy loading: about this dApp */
  { path: 'menu/about', loadChildren: './pages/about/about.module#AboutPageModule' },

  /* lazy loading: myprofile */
  { path: 'menu/myprofile', loadChildren: './pages/myprofile/myprofile.module#MyprofilePageModule' },
  { path: 'scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
