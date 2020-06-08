import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishPage } from './finish.page';

describe('FinishPage', () => {
  let component: FinishPage;
  let fixture: ComponentFixture<FinishPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinishPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinishPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
