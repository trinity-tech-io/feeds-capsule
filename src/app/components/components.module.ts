import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from './header-bar/header-bar.component';


@NgModule({
  declarations: [HeaderBarComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [HeaderBarComponent],
  providers: [
  ],
  entryComponents: [],
})
export class ComponentsModule { }
