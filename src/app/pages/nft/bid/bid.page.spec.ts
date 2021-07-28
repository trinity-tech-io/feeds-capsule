import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BidPage } from './bid.page';

describe('BidPage', () => {
  let component: BidPage;
  let fixture: ComponentFixture<BidPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BidPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
