import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeweventPage } from './newevent.page';

describe('NeweventPage', () => {
  let component: NeweventPage;
  let fixture: ComponentFixture<NeweventPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeweventPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeweventPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
