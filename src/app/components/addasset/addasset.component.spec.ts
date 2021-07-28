import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddassetComponent } from './addasset.component';

describe('AddassetComponent', () => {
  let component: AddassetComponent;
  let fixture: ComponentFixture<AddassetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddassetComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddassetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
