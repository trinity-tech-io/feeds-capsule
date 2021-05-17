import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnpublisheraccountPage } from './learnpublisheraccount.page';

describe('LearnpublisheraccountPage', () => {
  let component: LearnpublisheraccountPage;
  let fixture: ComponentFixture<LearnpublisheraccountPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LearnpublisheraccountPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnpublisheraccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
