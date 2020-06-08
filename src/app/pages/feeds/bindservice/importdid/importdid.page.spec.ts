import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportdidPage } from './importdid.page';

describe('ImportdidPage', () => {
  let component: ImportdidPage;
  let fixture: ComponentFixture<ImportdidPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportdidPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportdidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
