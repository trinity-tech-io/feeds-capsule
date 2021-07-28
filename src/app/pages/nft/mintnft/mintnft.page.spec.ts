import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MintnftPage } from './mintnft.page';

describe('MintnftPage', () => {
  let component: MintnftPage;
  let fixture: ComponentFixture<MintnftPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MintnftPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MintnftPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
