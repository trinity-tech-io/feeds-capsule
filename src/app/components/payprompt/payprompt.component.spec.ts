import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaypromptComponent } from './payprompt.component';

describe('PaypromptComponent', () => {
  let component: PaypromptComponent;
  let fixture: ComponentFixture<PaypromptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PaypromptComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaypromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
