import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartbindingPage } from './startbinding.page';

describe('StartbindingPage', () => {
  let component: StartbindingPage;
  let fixture: ComponentFixture<StartbindingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartbindingPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartbindingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
