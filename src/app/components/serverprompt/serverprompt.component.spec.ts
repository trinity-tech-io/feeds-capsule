import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerpromptComponent } from './serverprompt.component';

describe('ServerpromptComponent', () => {
  let component: ServerpromptComponent;
  let fixture: ComponentFixture<ServerpromptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerpromptComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerpromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
