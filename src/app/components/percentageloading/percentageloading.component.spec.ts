import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageloadingComponent } from './percentageloading.component';

describe('PercentageloadingComponent', () => {
  let component: PercentageloadingComponent;
  let fixture: ComponentFixture<PercentageloadingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PercentageloadingComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PercentageloadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
