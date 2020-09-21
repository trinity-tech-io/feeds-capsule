import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestsessionPage } from './testsession.page';

describe('TestsessionPage', () => {
  let component: TestsessionPage;
  let fixture: ComponentFixture<TestsessionPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestsessionPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestsessionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
