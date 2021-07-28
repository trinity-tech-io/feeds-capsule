import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedspreferencesPage } from './feedspreferences.page';

describe('FeedspreferencesPage', () => {
  let component: FeedspreferencesPage;
  let fixture: ComponentFixture<FeedspreferencesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeedspreferencesPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedspreferencesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
