import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatenewfeedPage } from './createnewfeed.page';

describe('CreatenewfeedPage', () => {
  let component: CreatenewfeedPage;
  let fixture: ComponentFixture<CreatenewfeedPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatenewfeedPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatenewfeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
