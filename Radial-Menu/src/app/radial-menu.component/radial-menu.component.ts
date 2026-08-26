import { Component, ElementRef, HostListener, input, OnInit, viewChild } from '@angular/core';

interface Segment {
  label: string;
  words: string[];
}

interface WordEntry {
  word: string;
  arcRadius: number;
  startAngle: number;
}

interface SegmentPath {
  d: string;
  labelPath: { id: string; d: string };
  slideDx: number;
  slideDy: number;
  wordPaths: { id: string; d: string }[];
}

@Component({
  selector: 'app-radial-menu',
  imports: [],
  templateUrl: './radial-menu.component.html',
  styleUrl: './radial-menu.component.scss',
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class RadialMenu implements OnInit {
  size = input<number>(600);

  readonly segments: Segment[] = [
    {
      label: 'Security',
      words: ['Firewall', 'Encryption', 'Zero Trust', 'Authentication', 'Authorization'],
    },
    { label: 'Performance', words: ['Load Balancing', 'Caching', 'CDN'] },
    { label: 'Architecture', words: ['Microservices', 'Containers'] },
    {
      label: 'Observability',
      words: ['Monitoring', 'Logging', 'Tracing', 'Four', 'Five', 'Six/seven'],
    },
    { label: 'DevOps', words: ['CI/CD', 'Automation', 'Pipelines'] },
    {
      label: 'Reliability',
      words: ['Scalability', 'High Availability', 'Failover', 'High demand'],
    },
  ];

  readonly svgSize = 1000;
  readonly cx = this.svgSize / 2;
  readonly cy = this.svgSize / 2;
  readonly innerRadius = this.svgSize * 0.1;
  readonly labelFontSize = this.svgSize * 0.012;
  readonly wordFontSize = this.svgSize * 0.014;
  readonly firstRing = this.innerRadius + this.svgSize * 0.07;
  readonly lastRing = this.innerRadius + this.svgSize * 0.43;
  readonly slideDistance = this.svgSize * 0.04;
  readonly segmentAngle = (2 * Math.PI) / this.segments.length;

  segmentPaths: SegmentPath[] = [];
  wordsBySegment: WordEntry[][] = [];
  hoveredIndex: number | null = null;

  private svgEl = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');

  ngOnInit(): void {
    this.wordsBySegment = this.segments.map((_, i) => this.buildWordEntries(i));
    this.segmentPaths = this.segments.map((_, i) => {
      const midAngle = (i + 0.5) * this.segmentAngle;
      return {
        d: this.buildSegmentPath(i),
        labelPath: { id: `label-arc-${i}`, d: this.buildLabelArcPath(i) },
        slideDx: -Math.cos(midAngle) * this.slideDistance,
        slideDy: -Math.sin(midAngle) * this.slideDistance,
        wordPaths: this.wordsBySegment[i].map((entry, wordIdx) => ({
          id: `word-arc-${i}-${wordIdx}`,
          d: this.buildWordArcPath(entry.arcRadius, entry.startAngle),
        })),
      };
    });
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.svgEl().nativeElement.getBoundingClientRect();
    const scaleX = this.svgSize / rect.width;
    const scaleY = this.svgSize / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    this.hoveredIndex = this.resolveSegment(svgX, svgY);
  }

  svgToCssPx(svgUnits: number): number {
    const rect = this.svgEl().nativeElement.getBoundingClientRect();
    return svgUnits * (rect.width / this.svgSize);
  }

  private resolveSegment(svgX: number, svgY: number): number | null {
    const dx = svgX - this.cx;
    const dy = svgY - this.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > this.svgSize / 2) return null;
    const angle = Math.atan2(dy, dx);
    const normalized = angle < 0 ? angle + 2 * Math.PI : angle;
    return Math.floor(normalized / this.segmentAngle);
  }

  private buildSegmentPath(i: number): string {
    const start = i * this.segmentAngle;
    const end = (i + 1) * this.segmentAngle;
    const x1 = this.cx + this.innerRadius * Math.cos(start);
    const y1 = this.cy + this.innerRadius * Math.sin(start);
    const x2 = this.cx + this.innerRadius * Math.cos(end);
    const y2 = this.cy + this.innerRadius * Math.sin(end);
    return `M ${this.cx} ${this.cy} L ${x1} ${y1} A ${this.innerRadius} ${this.innerRadius} 0 0 1 ${x2} ${y2} Z`;
  }

  private buildLabelArcPath(i: number): string {
    const midAngle = (i + 0.5) * this.segmentAngle;
    const isBelow = Math.sin(midAngle) > 0;
    const baseR = this.innerRadius + 3;
    const r = isBelow ? baseR + this.labelFontSize : baseR;
    const a0 = midAngle - Math.PI / 2;
    const a1 = midAngle + Math.PI / 2;
    const x1 = this.cx + r * Math.cos(a0);
    const y1 = this.cy + r * Math.sin(a0);
    const x2 = this.cx + r * Math.cos(a1);
    const y2 = this.cy + r * Math.sin(a1);
    return isBelow
      ? `M ${x2} ${y2} A ${r} ${r} 0 0 0 ${x1} ${y1}`
      : `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  private buildWordArcPath(arcRadius: number, startAngle: number): string {
    const halfSpan = this.segmentAngle * 0.42;
    const a0 = startAngle - halfSpan;
    const a1 = startAngle + halfSpan;
    const isBelow = Math.sin(startAngle) > 0;
    const r = isBelow ? arcRadius + this.wordFontSize : arcRadius;
    const x1 = this.cx + r * Math.cos(a0);
    const y1 = this.cy + r * Math.sin(a0);
    const x2 = this.cx + r * Math.cos(a1);
    const y2 = this.cy + r * Math.sin(a1);
    const largeArc = halfSpan * 2 > Math.PI ? 1 : 0;
    return isBelow
      ? `M ${x2} ${y2} A ${r} ${r} 0 ${largeArc} 0 ${x1} ${y1}`
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  private buildWordEntries(segmentIndex: number): WordEntry[] {
    const segWords = this.segments[segmentIndex].words;
    const start = segmentIndex * this.segmentAngle;
    const end = (segmentIndex + 1) * this.segmentAngle;
    const ringStep = (this.lastRing - this.firstRing) / segWords.length;
    let lastAngle = 0;
    return segWords.map((word, idx) => {
      const arcRadius = this.firstRing + ringStep * idx;
      const startAngle = this.pickAngle(start, end, lastAngle);
      lastAngle = startAngle;
      return { word, arcRadius, startAngle };
    });
  }

  private pickAngle(start: number, end: number, lastAngle: number): number {
    const paddedStart = start + 0.1;
    const paddedEnd = end - 0.1;
    const minDistance = 0.2;
    for (let i = 0; i < 500; i++) {
      const angle = Math.random() * (paddedEnd - paddedStart) + paddedStart;
      if (Math.abs(lastAngle - angle) >= minDistance) return angle;
    }
    return (paddedStart + paddedEnd) / 2;
  }
}
