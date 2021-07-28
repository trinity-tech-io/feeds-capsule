import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelcardComponent } from './channelcard.component';

describe('ChannelcardComponent', () => {
  let component: ChannelcardComponent;
  let fixture: ComponentFixture<ChannelcardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelcardComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
