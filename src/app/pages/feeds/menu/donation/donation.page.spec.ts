import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationPage } from './donation.page';

describe('DonationPage', () => {
  let component: DonationPage;
  let fixture: ComponentFixture<DonationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DonationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DonationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
