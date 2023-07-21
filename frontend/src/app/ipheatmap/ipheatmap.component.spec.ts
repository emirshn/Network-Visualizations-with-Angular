import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IpheatmapComponent } from './ipheatmap.component';

describe('IpheatmapComponent', () => {
  let component: IpheatmapComponent;
  let fixture: ComponentFixture<IpheatmapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IpheatmapComponent]
    });
    fixture = TestBed.createComponent(IpheatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
