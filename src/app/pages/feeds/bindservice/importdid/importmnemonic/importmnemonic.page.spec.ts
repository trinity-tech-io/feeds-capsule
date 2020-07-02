import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportmnemonicPage } from './importmnemonic.page';

describe('ImportmnemonicPage', () => {
  let component: ImportmnemonicPage;
  let fixture: ComponentFixture<ImportmnemonicPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportmnemonicPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportmnemonicPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
