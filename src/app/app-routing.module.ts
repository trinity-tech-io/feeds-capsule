import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
  { path: 'tabs', loadChildren: './pages/feeds/feeds.module#FeedsPageModule' },
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
    path: 'channels/:destDid/:channelId',
    loadChildren:
      './pages/feeds/home/channels/channels.module#ChannelsPageModule',
  },
  {
    path: 'postdetail/:destDid/:channelId/:postId',
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
    loadChildren: () => import('./pages/developer/developer.module').then(m => m.DeveloperPageModule)
  },
  {
    path: 'select-net',
    loadChildren: () => import('./pages/select-net/select-net.module').then(m => m.SelectNetPageModule)
  },
  {
    path: 'select-ipfs-net',
    loadChildren: () => import('./pages/select-ipfs-net/select-ipfs-net.module').then(m => m.SelectIpfsNetPageModule)
  },
  {
    path: 'nftavatarlist',
    loadChildren: () => import('./pages/nftavatarlist/nftavatarlist.module').then(m => m.NftavatarlistPageModule)
  },
  {
    path: 'whitelist',
    loadChildren: () => import('./pages/whitelist/whitelist.module').then(m => m.WhitelistPageModule)
  },
  {
    path: 'datastorage',
    loadChildren: () => import('./pages/settings/datastorage/datastorage.module').then(m => m.DatastoragePageModule)
  },
  {
    path: 'galleriachannel',
    loadChildren: () => import('./pages/galleriachannel/galleriachannel.module').then(m => m.GalleriachannelPageModule)
  },
  {
    path: 'scan',
    loadChildren: () => import('./pages/scan/scan.module').then(m => m.ScanPageModule)
  },
  {
    path: 'migrationdata',
    loadChildren: () => import('./pages/settings/migrationdata/migrationdata.module').then(m => m.MigrationdataPageModule)
  },
  {
    path: 'hive-interface-test',
    loadChildren: () => import('./pages/hive-interface-test/hive-interface-test.module').then( m => m.HiveInterfaceTestPageModule)
  },
  {
    path: 'galleriahive',
    loadChildren: () => import('./pages/galleriahive/galleriahive.module').then( m => m.GalleriahivePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
