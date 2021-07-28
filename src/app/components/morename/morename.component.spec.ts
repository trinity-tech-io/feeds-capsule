import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MorenameComponent } from './morename.component';

describe('MorenameComponent', () => {
  let component: MorenameComponent;
  let fixture: ComponentFixture<MorenameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MorenameComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MorenameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
