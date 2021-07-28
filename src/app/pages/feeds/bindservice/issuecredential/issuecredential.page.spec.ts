import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuecredentialPage } from './issuecredential.page';

describe('IssuecredentialPage', () => {
  let component: IssuecredentialPage;
  let fixture: ComponentFixture<IssuecredentialPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IssuecredentialPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuecredentialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
