import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ChannelcollectionsPageRoutingModule } from './channelcollections-routing.module';
import { ChannelcollectionsPage } from './channelcollections.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    ChannelcollectionsPageRoutingModule
  ],
  declarations: [ChannelcollectionsPage]
})
export class ChannelcollectionsPageModule {}
