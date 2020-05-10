import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplashscreenPage } from './splashscreen.page';

describe('SplashscreenPage', () => {
  let component: SplashscreenPage;
  let fixture: ComponentFixture<SplashscreenPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplashscreenPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplashscreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
