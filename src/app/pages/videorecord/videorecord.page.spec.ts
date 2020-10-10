import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideorecordPage } from './videorecord.page';

describe('VideorecordPage', () => {
  let component: VideorecordPage;
  let fixture: ComponentFixture<VideorecordPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideorecordPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideorecordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
