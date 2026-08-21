import { Component, signal } from '@angular/core';
import { RadialMenu } from './radial-menu.component/radial-menu.component';

@Component({
  selector: 'app-root',
  imports: [RadialMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Radia-Menu');
}
