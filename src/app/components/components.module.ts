import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from './header-bar/header-bar.component';

import { DetailsComponent} from './details/details.component';
import { MyfeedsComponent} from './myfeeds/myfeeds.component';
import { FollowingComponent} from './following/following.component';
import { LikesComponent} from './likes/likes.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [HeaderBarComponent,DetailsComponent,MyfeedsComponent,FollowingComponent,LikesComponent],
  exports: [HeaderBarComponent,DetailsComponent,MyfeedsComponent,FollowingComponent,LikesComponent],
  providers: [
  ],
  entryComponents: [],
})
export class ComponentsModule { }
