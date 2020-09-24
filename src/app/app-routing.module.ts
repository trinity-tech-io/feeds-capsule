import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  { path: '', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'tabs', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'splashscreen', loadChildren: './pages/splashscreen/splashscreen.module#SplashscreenPageModule' },

  { path: 'menu/servers', loadChildren: './pages/servers/servers.module#ServersPageModule' },
  { path: 'menu/servers/server-info/:address/:nodeId/:isOwner', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/server-info/:nodeId/:isOwner', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/server-info/:address', loadChildren: './pages/servers/server-info/server-info.module#ServerInfoPageModule'},
  { path: 'menu/servers/add-server', loadChildren: './pages/servers/add-server/add-server.module#AddServerPageModule'},

  { path: 'signin', loadChildren: './pages/signin/signin.module#SigninPageModule' },

  { path: 'createnewfeed', loadChildren: './pages/feeds/createnewfeed/createnewfeed.module#CreatenewfeedPageModule' },
  { path: 'createnewpost/:nodeId/:channelId', loadChildren: './pages/feeds/createnewpost/createnewpost.module#CreatenewpostPageModule' },
  { path: 'profileimage', loadChildren: './pages/feeds/profileimage/profileimage.module#ProfileimagePageModule' },

  { path: 'bindservice/scanqrcode', loadChildren: './pages/feeds/bindservice/scanqrcode/scanqrcode.module#ScanqrcodePageModule'},
  { path: 'bindservice/importdid/:nodeId', loadChildren: './pages/feeds/bindservice/importdid/importdid.module#ImportdidPageModule' },
  { path: 'bindservice/publishdid/:nodeId/:did/:payload', loadChildren: './pages/feeds/bindservice/publishdid/publishdid.module#PublishdidPageModule' },
  { path: 'bindservice/issuecredential/:nodeId/:did', loadChildren: './pages/feeds/bindservice/issuecredential/issuecredential.module#IssuecredentialPageModule' },
  { path: 'bindservice/finish/:nodeId', loadChildren: './pages/feeds/bindservice/finish/finish.module#FinishPageModule' },
  { path: 'bindservice/startbinding/:nodeId/:nonce/:address/:did/:feedsUrl', loadChildren: './pages/feeds/bindservice/startbinding/startbinding.module#StartbindingPageModule' },
  
  { path: 'channels/:nodeId/:channelId', loadChildren: './pages/feeds/home/channels/channels.module#ChannelsPageModule' },
  { path: 'postdetail/:nodeId/:channelId/:postId', loadChildren: './pages/feeds/home/postdetail/postdetail.module#PostdetailPageModule' },

  { path: 'menu/setting', loadChildren: './pages/feeds/menu/setting/setting.module#SettingPageModule' },
  { path: 'menu/profiledetail', loadChildren: './pages/feeds/menu/profiledetail/profiledetail.module#ProfiledetailPageModule' },
  { path: 'menu/about', loadChildren: './pages/about/about.module#AboutPageModule' },
  { path: 'menu/develop', loadChildren: './pages/feeds/menu/develop/develop.module#DevelopPageModule' },
  { path: 'menu/donation', loadChildren: './pages/feeds/menu/donation/donation.module#DonationPageModule' },

  { path: 'disclaimer', loadChildren: './pages/disclaimer/disclaimer.module#DisclaimerPageModule' },

  { path: 'editserverinfo', loadChildren: './pages/editserverinfo/editserverinfo.module#EditserverinfoPageModule' },
  { path: 'eidtchannel', loadChildren: './pages/eidtchannel/eidtchannel.module#EidtchannelPageModule' },
  { path: 'editpost', loadChildren: './pages/editpost/editpost.module#EditpostPageModule' },
  { path: 'editcomment', loadChildren: './pages/editcomment/editcomment.module#EditcommentPageModule' },
  { path: 'discoverfeeds', loadChildren: './pages/servers/discoverfeeds/discoverfeeds.module#DiscoverfeedsPageModule' },
  { path: 'discoverfeedsinfo', loadChildren: './pages/servers/discoverfeedsinfo/discoverfeedsinfo.module#DiscoverfeedsinfoPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
