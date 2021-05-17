import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroducePage } from './introduce.page';

describe('IntroducePage', () => {
  let component: IntroducePage;
  let fixture: ComponentFixture<IntroducePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntroducePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroducePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
