import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostfromComponent } from './postfrom.component';

describe('PostfromComponent', () => {
  let component: PostfromComponent;
  let fixture: ComponentFixture<PostfromComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostfromComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostfromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
