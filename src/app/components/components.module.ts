import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


import { ServerpromptComponent} from './serverprompt/serverprompt.component';
import { PaypromptComponent } from './payprompt/payprompt.component';
import { TipdialogComponent} from './tipdialog/tipdialog.component';
import { BackhomeComponent} from './backhome/backhome.component';
import { MorenameComponent} from './morename/morename.component';
import { EdittoolComponent} from './edittool/edittool.component';

import { MyfeedsComponent} from './myfeeds/myfeeds.component';
import { FollowingComponent} from './following/following.component';
import { LikesComponent} from './likes/likes.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
  ],

  declarations: [EdittoolComponent,MorenameComponent,BackhomeComponent,TipdialogComponent,PaypromptComponent,ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent],
  exports: [EdittoolComponent,MorenameComponent,BackhomeComponent,TipdialogComponent,PaypromptComponent,ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent],

  providers: [
  ],
  entryComponents: [EdittoolComponent,MorenameComponent,BackhomeComponent,TipdialogComponent,ServerpromptComponent,
    PaypromptComponent,],
})
export class ComponentsModule { }
