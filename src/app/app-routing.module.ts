import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'tabs', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },

  {
    path: 'menu/servers/server-info',
    loadChildren:
      './pages/servers/server-info/server-info.module#ServerInfoPageModule',
  },

  {
    path: 'signin',
    loadChildren: './pages/signin/signin.module#SigninPageModule',
  },

  {
    path: 'createnewfeed',
    loadChildren:
      './pages/feeds/createnewfeed/createnewfeed.module#CreatenewfeedPageModule',
  },
  {
    path: 'createnewpost',
    loadChildren:
      './pages/feeds/createnewpost/createnewpost.module#CreatenewpostPageModule',
  },
  {
    path: 'profileimage',
    loadChildren:
      './pages/feeds/profileimage/profileimage.module#ProfileimagePageModule',
  },

  {
    path: 'bindservice/learnpublisheraccount',
    loadChildren:
      './pages/feeds/bindservice/learnpublisheraccount/learnpublisheraccount.module#LearnpublisheraccountPageModule',
  },
  {
    path: 'bindservice/introduce',
    loadChildren:
      './pages/feeds/bindservice/introduce/introduce.module#IntroducePageModule',
  },
  {
    path: 'bindservice/scanqrcode',
    loadChildren:
      './pages/feeds/bindservice/scanqrcode/scanqrcode.module#ScanqrcodePageModule',
  },
  {
    path: 'bindservice/importdid/:nodeId',
    loadChildren:
      './pages/feeds/bindservice/importdid/importdid.module#ImportdidPageModule',
  },
  {
    path: 'bindservice/publishdid/:nodeId/:did/:payload',
    loadChildren:
      './pages/feeds/bindservice/publishdid/publishdid.module#PublishdidPageModule',
  },
  {
    path: 'bindservice/issuecredential/:nodeId/:did',
    loadChildren:
      './pages/feeds/bindservice/issuecredential/issuecredential.module#IssuecredentialPageModule',
  },
  {
    path: 'bindservice/startbinding/:nodeId/:nonce/:address/:did/:feedsUrl',
    loadChildren:
      './pages/feeds/bindservice/startbinding/startbinding.module#StartbindingPageModule',
  },

  {
    path: 'channels/:nodeId/:channelId',
    loadChildren:
      './pages/feeds/home/channels/channels.module#ChannelsPageModule',
  },
  {
    path: 'postdetail/:nodeId/:channelId/:postId',
    loadChildren:
      './pages/feeds/home/postdetail/postdetail.module#PostdetailPageModule',
  },

  {
    path: 'menu/profiledetail',
    loadChildren:
      './pages/feeds/menu/profiledetail/profiledetail.module#ProfiledetailPageModule',
  },
  {
    path: 'menu/about',
    loadChildren: './pages/about/about.module#AboutPageModule',
  },
  {
    path: 'disclaimer',
    loadChildren: './pages/disclaimer/disclaimer.module#DisclaimerPageModule',
  },
  {
    path: 'editserverinfo',
    loadChildren:
      './pages/editserverinfo/editserverinfo.module#EditserverinfoPageModule',
  },
  {
    path: 'eidtchannel',
    loadChildren:
      './pages/eidtchannel/eidtchannel.module#EidtchannelPageModule',
  },
  {
    path: 'editpost',
    loadChildren: './pages/editpost/editpost.module#EditPostPageModule',
  },
  {
    path: 'editcomment',
    loadChildren:
      './pages/editcomment/editcomment.module#EditCommentPageModule',
  },
  {
    path: 'settings',
    loadChildren: './pages/settings/settings.module#SettingsPageModule',
  },
  {
    path: 'editimage',
    loadChildren: './pages/editimage/editimage.module#EditimagePageModule',
  },
  {
    path: 'discoverfeedinfo',
    loadChildren:
      './pages/discoverfeedinfo/discoverfeedinfo.module#DiscoverfeedinfoPageModule',
  },
  {
    path: 'feedinfo',
    loadChildren: './pages/feedinfo/feedinfo.module#FeedinfoPageModule',
  },
  {
    path: 'commentlist',
    loadChildren:
      './pages/commentlist/commentlist.module#CommentlistPageModule',
  },
  {
    path: 'feedspreferences',
    loadChildren:
      './pages/feedspreferences/feedspreferences.module#FeedspreferencesPageModule',
  },
  {
    path: 'language',
    loadChildren:
      './pages/settings/language/language.module#LanguagePageModule',
  },
  {
    path: 'mintnft',
    loadChildren: './pages/nft/mintnft/mintnft.module#MintnftPageModule',
  },
  {
    path: 'assetdetails',
    loadChildren:
      './pages/nft/assetdetails/assetdetails.module#AssetdetailsPageModule',
  },
  { path: 'bid', loadChildren: './pages/nft/bid/bid.module#BidPageModule' },
  {
    path: 'channelsviewall',
    loadChildren: './pages/feeds/search/search.module#SearchPageModule',
  },
  {
    path: 'learnmore',
    loadChildren: './pages/learnmore/learnmore.module#LearnmorePageModule',
  },
  {
    path: 'walletteach',
    loadChildren:
      './pages/walletteach/walletteach.module#WalletteachPageModule',
  },
  {
    path: 'subscriptions',
    loadChildren:
      './pages/subscriptions/subscriptions.module#SubscriptionsPageModule',
  },
  {
    path: 'elastosapiprovider',
    loadChildren:
      './pages/elastosapiprovider/elastosapiprovider.module#ElastosapiproviderPageModule',
  },
  {
    path: 'profilenftimage',
    loadChildren:
      './pages/profilenftimage/profilenftimage.module#ProfilenftimagePageModule',
  },
  {
    path: 'editprofileimage',
    loadChildren: () =>
      import('./pages/editprofileimage/editprofileimage.module').then(
        m => m.EditprofileimagePageModule,
      ),
  },
  {
    path: 'developer',
    loadChildren: () => import('./pages/developer/developer.module').then( m => m.DeveloperPageModule)
  },
  {
    path: 'select-net',
    loadChildren: () => import('./pages/select-net/select-net.module').then( m => m.SelectNetPageModule)
  },
  {
    path: 'guidemac',
    loadChildren: () => import('./pages/guidemac/guidemac.module').then( m => m.GuidemacPageModule)
  },
  {
    path: 'guideubuntu',
    loadChildren: () => import('./pages/guideubuntu/guideubuntu.module').then( m => m.GuideubuntuPageModule)
  },
  {
    path: 'select-ipfs-net',
    loadChildren: () => import('./pages/select-ipfs-net/select-ipfs-net.module').then( m => m.SelectIpfsNetPageModule)
  },
  {
    path: 'nftavatarlist',
    loadChildren: () => import('./pages/nftavatarlist/nftavatarlist.module').then( m => m.NftavatarlistPageModule)
  },
  {
    path: 'whitelist',
    loadChildren: () => import('./pages/whitelist/whitelist.module').then( m => m.WhitelistPageModule)
  },
  {
    path: 'datastorage',
    loadChildren: () => import('./pages/settings/datastorage/datastorage.module').then(m => m.DatastoragePageModule)
  },
  {
    path: 'galleriachannel',
    loadChildren: () => import('./pages/galleriachannel/galleriachannel.module').then( m => m.GalleriachannelPageModule)
  },
  {
    path: 'scan',
    loadChildren: () => import('./pages/scan/scan.module').then( m => m.ScanPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
