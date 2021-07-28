import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfiledetailPage } from './profiledetail.page';

describe('ProfiledetailPage', () => {
  let component: ProfiledetailPage;
  let fixture: ComponentFixture<ProfiledetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProfiledetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfiledetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
