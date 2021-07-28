import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedinfoPage } from './feedinfo.page';

describe('FeedinfoPage', () => {
  let component: FeedinfoPage;
  let fixture: ComponentFixture<FeedinfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeedinfoPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
