import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopovercomponentPage } from './popovercomponent.page';

describe('PopovercomponentPage', () => {
  let component: PopovercomponentPage;
  let fixture: ComponentFixture<PopovercomponentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopovercomponentPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopovercomponentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
