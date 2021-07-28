import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchfeedComponent } from './switchfeed.component';

describe('SwitchfeedComponent', () => {
  let component: SwitchfeedComponent;
  let fixture: ComponentFixture<SwitchfeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SwitchfeedComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchfeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
