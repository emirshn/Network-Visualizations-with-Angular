import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafmapComponent } from './leafmap.component';

describe('LeafmapComponent', () => {
  let component: LeafmapComponent;
  let fixture: ComponentFixture<LeafmapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LeafmapComponent]
    });
    fixture = TestBed.createComponent(LeafmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
