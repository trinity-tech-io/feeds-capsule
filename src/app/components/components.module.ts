import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


import { ServerpromptComponent} from './serverprompt/serverprompt.component';
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
  declarations: [ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent],
  exports: [ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent],
  providers: [
  ],
  entryComponents: [],
})
export class ComponentsModule { }
