import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideofullscreenComponent } from './videofullscreen.component';

describe('VideofullscreenComponent', () => {
  let component: VideofullscreenComponent;
  let fixture: ComponentFixture<VideofullscreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideofullscreenComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideofullscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
