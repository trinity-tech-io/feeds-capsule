import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'tabs', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'splashscreen', loadChildren: './pages/splashscreen/splashscreen.module#SplashscreenPageModule' },

  { path: 'menu/servers', loadChildren: './pages/servers/servers.module#ServersPageModule' },
  { path: 'menu/servers/server-info/:nodeId', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/add-server/:address', loadChildren: './pages/servers/add-server/add-server.module#AddServerPageModule'},
  { path: 'menu/servers/add-server/scan', loadChildren: './pages/servers/add-server/scan/scan.module#ScanPageModule' },

  { path: 'signin', loadChildren: './pages/signin/signin.module#SigninPageModule' },

  { path: 'menu/myfeeds/create', loadChildren: './pages/myfeeds/create/create-feed.module#CreateFeedPageModule' },
  { path: 'createnewfeed', loadChildren: './pages/feeds/createnewfeed/createnewfeed.module#CreatenewfeedPageModule' },
  { path: 'createnewpost/:nodeId/:channelId', loadChildren: './pages/feeds/createnewpost/createnewpost.module#CreatenewpostPageModule' },
  { path: 'profileimage', loadChildren: './pages/feeds/profileimage/profileimage.module#ProfileimagePageModule' },

  { path: 'bindservice/scanqrcode', loadChildren: './pages/feeds/bindservice/scanqrcode/scanqrcode.module#ScanqrcodePageModule'},
  { path: 'bindservice/importdid/:nodeId', loadChildren: './pages/feeds/bindservice/importdid/importdid.module#ImportdidPageModule' },
  { path: 'bindservice/publishdid/:nodeId/:did/:payload', loadChildren: './pages/feeds/bindservice/publishdid/publishdid.module#PublishdidPageModule' },
  { path: 'bindservice/issuecredential/:nodeId/:did', loadChildren: './pages/feeds/bindservice/issuecredential/issuecredential.module#IssuecredentialPageModule' },
  { path: 'bindservice/finish/:nodeId', loadChildren: './pages/feeds/bindservice/finish/finish.module#FinishPageModule' },
  { path: 'bindservice/startbinding/:nodeId/:nonce/:address', loadChildren: './pages/feeds/bindservice/startbinding/startbinding.module#StartbindingPageModule' },
  { path: 'bindservice/importmnemonic/:nodeId', loadChildren: './pages/feeds/bindservice/importdid/importmnemonic/importmnemonic.module#ImportmnemonicPageModule' },

  { path: 'channels/:nodeId/:channelId', loadChildren: './pages/feeds/home/channels/channels.module#ChannelsPageModule' },
  { path: 'postdetail/:nodeId/:channelId/:postId', loadChildren: './pages/feeds/home/postdetail/postdetail.module#PostdetailPageModule' },
  { path: 'menu/setting', loadChildren: './pages/feeds/setting/setting.module#SettingPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
