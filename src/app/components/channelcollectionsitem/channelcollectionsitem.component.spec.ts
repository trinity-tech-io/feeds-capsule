import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ChannelcollectionsitemComponent } from './channelcollectionsitem.component';

describe('ChannelcollectionsitemComponent', () => {
  let component: ChannelcollectionsitemComponent;
  let fixture: ComponentFixture<ChannelcollectionsitemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelcollectionsitemComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelcollectionsitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
