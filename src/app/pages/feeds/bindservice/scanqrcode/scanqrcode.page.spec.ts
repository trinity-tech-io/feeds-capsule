import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanqrcodePage } from './scanqrcode.page';

describe('ScanqrcodePage', () => {
  let component: ScanqrcodePage;
  let fixture: ComponentFixture<ScanqrcodePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanqrcodePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanqrcodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
