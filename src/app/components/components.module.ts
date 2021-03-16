import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

import { ServerpromptComponent} from './serverprompt/serverprompt.component';
import { PaypromptComponent } from './payprompt/payprompt.component';
import { TipdialogComponent} from './tipdialog/tipdialog.component';
import { MorenameComponent} from './morename/morename.component';
import { EdittoolComponent} from './edittool/edittool.component';

import {ConfirmdialogComponent} from './confirmdialog/confirmdialog.component';
import {AlertdialogComponent} from './alertdialog/alertdialog.component';

import { MyfeedsComponent} from './myfeeds/myfeeds.component';
import { FollowingComponent} from './following/following.component';
import { LikesComponent} from './likes/likes.component';
import { CommentComponent } from './comment/comment.component';
import { SwitchfeedComponent } from './switchfeed/switchfeed.component';
import { PreviewqrcodeComponent } from './previewqrcode/previewqrcode.component';
import { SharemenuComponent } from './sharemenu/sharemenu.component';
import { RoundloadingComponent } from './roundloading/roundloading.component';
import { PercentageloadingComponent } from './percentageloading/percentageloading.component';

import { VideofullscreenComponent } from './videofullscreen/videofullscreen.component';

import { VgCoreModule } from 'ngx-videogular';
import { VgControlsModule } from 'ngx-videogular';
import { VgOverlayPlayModule } from 'ngx-videogular';
import { VgBufferingModule } from 'ngx-videogular';

import { ShareModule } from 'src/app/share/share.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    TranslateModule,
    IonicModule,
    ShareModule,
    QRCodeModule
  ],

  declarations: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    EdittoolComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    PreviewqrcodeComponent,
    ServerpromptComponent,
    MyfeedsComponent,
    FollowingComponent,
    LikesComponent,
    CommentComponent,
    SwitchfeedComponent,
    SharemenuComponent,
    VideofullscreenComponent,
    RoundloadingComponent,
    PercentageloadingComponent
  ],
  exports: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    EdittoolComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    PreviewqrcodeComponent,
    ServerpromptComponent,
    MyfeedsComponent,
    FollowingComponent,
    LikesComponent,
    CommentComponent,
    SwitchfeedComponent,
    SharemenuComponent,
    VideofullscreenComponent,
    RoundloadingComponent,
    PercentageloadingComponent
  ],

  providers: [
  ],
  entryComponents: [VideofullscreenComponent,AlertdialogComponent,ConfirmdialogComponent,EdittoolComponent,MorenameComponent,TipdialogComponent,ServerpromptComponent,
    PaypromptComponent,PreviewqrcodeComponent],
})
export class ComponentsModule { }
