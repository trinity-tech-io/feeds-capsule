import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InitializePage } from './initialize.page';

describe('InitializePage', () => {
  let component: InitializePage;
  let fixture: ComponentFixture<InitializePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InitializePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitializePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
