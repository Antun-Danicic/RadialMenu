import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-radial-menu',
  imports: [],
  templateUrl: './radial-menu.component.html',
  styleUrl: './radial-menu.component.scss',
})
export class RadialMenu implements OnInit {
  words = [
    ['Firewall', 'Encryption', 'Zero Trust', 'Authentication', 'Authorization'],
    ['Load Balancing', 'Caching', 'CDN'],
    ['Microservices', 'Containers'],
    ['Monitoring', 'Logging', 'Tracing', 'Four', 'Five', 'Six/seven'],
    ['CI/CD', 'Automation', 'Pipelines'],
    ['Scalability', 'High Availability', 'Failover', 'High demand'],
    /* 
    ['Machine Learning', 'AI', 'Deep Learning'],
    ['Blockchain', 'Smart Contracts', 'Decentralization'],
    ['IoT', 'Edge Computing', 'Sensors'],
    ['AR/VR', 'Mixed Reality', 'Holograms'], */
  ];

  wordPositionsBySegment: {
    [segmentIndex: number]: { word: string; arcRadius: number; startAngle: number }[];
  } = {};

  ngOnInit() {
    const cx = this.center.x;
    const cy = this.center.y;

    for (let i = 0; i < this.words.length; i++) {
      this.wordPositionsBySegment[i] = this.generateWordPositions(i, cx, cy);
    }
  }

  radius = 100;
  center = { x: 500, y: 500 };
  lastAngle: number = 0;

  mouse = { x: 0, y: 0 };
  hoveredIndex: number | null = null;

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const svg = document.querySelector('svg')!;
    const rect = svg.getBoundingClientRect();

    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    this.hoveredIndex = this.getHoveredSegment();
  }

  getHoveredSegment(): number | null {
    const dx = this.mouse.x - this.center.x;
    const dy = this.mouse.y - this.center.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 500) return null;

    const angle = Math.atan2(dy, dx);
    const normalized = angle < 0 ? angle + 2 * Math.PI : angle;

    const segmentAngle = (2 * Math.PI) / this.words.length;
    return Math.floor(normalized / segmentAngle);
  }

  getPathForSegment(i: number): string {
    const angle = (2 * Math.PI) / this.words.length;
    const start = i * angle;
    const end = (i + 1) * angle;

    const x1 = this.center.x + this.radius * Math.cos(start);
    const y1 = this.center.y + this.radius * Math.sin(start);
    const x2 = this.center.x + this.radius * Math.cos(end);
    const y2 = this.center.y + this.radius * Math.sin(end);

    return `
      M ${this.center.x} ${this.center.y}
      L ${x1} ${y1}
      A ${this.radius} ${this.radius} 0 0 1 ${x2} ${y2}
      Z
    `;
  }

  /** Arc path for a single word, centred at its angle, on its ring radius. */
  getWordArcPath(arcRadius: number, startAngle: number, segmentIndex: number): string {
    const segAngle = (2 * Math.PI) / this.words.length;
    const halfSpan = segAngle * 0.42;
    const a0 = startAngle - halfSpan;
    const a1 = startAngle + halfSpan;

    const x1 = this.center.x + arcRadius * Math.cos(a0);
    const y1 = this.center.y + arcRadius * Math.sin(a0);
    const x2 = this.center.x + arcRadius * Math.cos(a1);
    const y2 = this.center.y + arcRadius * Math.sin(a1);

    // Rijeci ispod centra — zamijeniti start/end i promijeniti sweep u 0 (CCW)
    // tako tekst teče po gornjoj strani luka i ostaje čitljiv
    const isBelow = this.center.y + arcRadius * Math.sin(startAngle) > this.center.y;
    if (isBelow) {
      return `M ${x2} ${y2} A ${arcRadius} ${arcRadius} 0 0 0 ${x1} ${y1}`;
    }
    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`;
  }

  getClipPath(i: number): string {
    const background = document.querySelector('.background')!;
    const rect = background.getBoundingClientRect();

    const angle = (2 * Math.PI) / this.words.length;
    const start = i * angle;
    const end = (i + 1) * angle;

    const r = 1000;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);

    return `polygon(
    ${cx}px ${cy}px,
    ${x1}px ${y1}px,
    ${x2}px ${y2}px
  )`;
  }

  generateAngle(word: string, start: number, end: number): number {
    const boundaryPaddingStart = start + 0.27;
    const boundaryPaddingEnd = end - 0.2;
    const minAngleDistance = 0.2;

    let angle: number = 0;
    let tries = 0;

    while (true) {
      if (tries > 50) {
        break;
      }
      tries++;

      angle = Math.random() * (boundaryPaddingEnd - boundaryPaddingStart) + boundaryPaddingStart;

      if (Math.abs(this.lastAngle - angle) < minAngleDistance) continue;

      this.lastAngle = angle;
      break;
    }
    return angle;
  }

  generateWordPositions(segmentIndex: number, cx: number, cy: number) {
    const firstRing = this.radius + 70;
    const lastRing = this.radius + 350;
    const angle = (2 * Math.PI) / this.words.length;
    const start = segmentIndex * angle;
    const end = (segmentIndex + 1) * angle;

    const words = this.words[segmentIndex];

    const rings = words.map((word, id) => {
      const ringsScope = lastRing - firstRing;
      const ringsNum = words.length;
      const currentRingValue = firstRing + (ringsScope / ringsNum) * id + 1;
      console.log('zone value for word: ', word, ' is: ', currentRingValue);
      return currentRingValue;
    });

    return words.map((word, idx) => {
      const angle = this.generateAngle(word, start, end);
      return { word, arcRadius: rings[idx], startAngle: angle };
    });
  }
}
