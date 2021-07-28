import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyviewallPage } from './currencyviewall.page';

describe('CurrencyviewallPage', () => {
  let component: CurrencyviewallPage;
  let fixture: ComponentFixture<CurrencyviewallPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CurrencyviewallPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencyviewallPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
