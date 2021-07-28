import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatenewpostPage } from './createnewpost.page';

describe('CreatenewpostPage', () => {
  let component: CreatenewpostPage;
  let fixture: ComponentFixture<CreatenewpostPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatenewpostPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatenewpostPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
