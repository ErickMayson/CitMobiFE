import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RotasComponent } from './rotas.component';

describe('RotasComponent', () => {
  let component: RotasComponent;
  let fixture: ComponentFixture<RotasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
