import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundloadingComponent } from './roundloading.component';

describe('RoundloadingComponent', () => {
  let component: RoundloadingComponent;
  let fixture: ComponentFixture<RoundloadingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoundloadingComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundloadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
