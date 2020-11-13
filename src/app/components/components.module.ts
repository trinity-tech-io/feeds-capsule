import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


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

import { VgCoreModule } from 'ngx-videogular';
import { VgControlsModule } from 'ngx-videogular';
import { VgOverlayPlayModule } from 'ngx-videogular';
import { VgBufferingModule } from 'ngx-videogular';

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
  ],

  declarations: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    EdittoolComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    ServerpromptComponent,
    MyfeedsComponent,
    FollowingComponent,
    LikesComponent,
    CommentComponent
  ],
  exports: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    EdittoolComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    ServerpromptComponent,
    MyfeedsComponent,
    FollowingComponent,
    LikesComponent,
    CommentComponent
  ],

  providers: [
  ],
  entryComponents: [AlertdialogComponent,ConfirmdialogComponent,EdittoolComponent,MorenameComponent,TipdialogComponent,ServerpromptComponent,
    PaypromptComponent,],
})
export class ComponentsModule { }
