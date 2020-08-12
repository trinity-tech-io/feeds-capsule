import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from './header-bar/header-bar.component';

import { ServerpromptComponent} from './serverprompt/serverprompt.component';
import { MyfeedsComponent} from './myfeeds/myfeeds.component';
import { FollowingComponent} from './following/following.component';
import { LikesComponent} from './likes/likes.component';
import { SourceComponent} from './source/source.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
  ],
  declarations: [HeaderBarComponent,ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent,SourceComponent],
  exports: [HeaderBarComponent,ServerpromptComponent,MyfeedsComponent,FollowingComponent,LikesComponent,SourceComponent],
  providers: [
  ],
  entryComponents: [],
})
export class ComponentsModule { }
