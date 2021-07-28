import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetdetailsPage } from './assetdetails.page';

describe('AssetdetailsPage', () => {
  let component: AssetdetailsPage;
  let fixture: ComponentFixture<AssetdetailsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssetdetailsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetdetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
