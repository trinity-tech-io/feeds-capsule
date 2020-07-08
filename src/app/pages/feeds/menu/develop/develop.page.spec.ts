import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DevelopPage } from './develop.page';

describe('DevelopPage', () => {
  let component: DevelopPage;
  let fixture: ComponentFixture<DevelopPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DevelopPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DevelopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
