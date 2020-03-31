type onResult = ((result: number[]) => void) | (() => Promise<void>);
type onChange = ((result: number[]) => void);
type Keyboard = [number, number];

interface Options {
  container: HTMLElement;
  keyboard?: Keyboard;
  errorDuration?: number;
  checkInterval?: number;
  onResult?: onResult;
  onChange?: onChange;
}

interface DefaultConfig extends Options {
  keyboard: Keyboard;
  errorDuration: number;
  checkInterval: number;
}

class Lock {
  private container!: HTMLElement;

  private errorDuration!: number;

  private checkInterval!: number;

  private keyboard!: Keyboard;

  private onResult?: onResult;

  private onChange?: onChange;

  private errorTimer!: NodeJS.Timeout | null;

  private checkTimer!: NodeJS.Timeout | null;

  private resultCoordinates: string[] = [];

  private numberMap: Record<string, number> = {};

  private bodyOldOverflow!: string;

  private width!: number;

  private height!: number;

  private radius!: number;

  private bgCanvas!: HTMLCanvasElement;

  private interactionCanvas!: HTMLCanvasElement;

  private checkingCanvas!: HTMLCanvasElement;

  private bgCtx!: CanvasRenderingContext2D;

  private interactionCtx!: CanvasRenderingContext2D;

  private checkingCtx!: CanvasRenderingContext2D;

  constructor(options: Options) {
    this.touchstart = this.touchstart.bind(this);
    this.touchend = this.touchend.bind(this);
    this.touchmove = this.touchmove.bind(this);

    this.init({
      keyboard: [3, 3],
      errorDuration: 2000,
      checkInterval: 150,
      ...options,
    });
    this.drawBg();
    this.bindEvent();
  }

  private init(config: DefaultConfig): void {
    this.container = config.container;
    this.keyboard = config.keyboard;
    this.errorDuration = config.errorDuration;
    this.checkInterval = config.checkInterval;
    this.onResult = config.onResult;
    this.onChange = config.onChange;

    this.errorTimer = null;
    this.checkTimer = null;

    this.container.style.position = 'relative';
    this.bgCanvas = document.createElement('canvas');
    this.interactionCanvas = document.createElement('canvas');
    this.checkingCanvas = document.createElement('canvas');

    this.width = this.container.getBoundingClientRect().width;
    this.height = this.container.getBoundingClientRect().height;
    this.checkingCanvas.width = this.width;
    this.bgCanvas.width = this.width;
    this.interactionCanvas.width = this.width;
    this.checkingCanvas.height = this.height;
    this.bgCanvas.height = this.height;
    this.interactionCanvas.height = this.height;

    this.bgCanvas.style.position = 'absolute';
    this.interactionCanvas.style.position = 'absolute';
    this.checkingCanvas.style.position = 'absolute';
    this.checkingCanvas.style.display = 'none';

    this.bgCtx = this.bgCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.interactionCtx = this.interactionCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.checkingCtx = this.checkingCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.container.appendChild(this.bgCanvas);
    this.container.appendChild(this.interactionCanvas);
    this.container.appendChild(this.checkingCanvas);

    this.radius = (Math.min(this.width, this.height) / Math.max(...this.keyboard)) / 3;
  }

  private drawBg(): void {
    const [rows, cols] = this.keyboard;
    const rowOffset = this.width / (rows + 1);
    const colOffset = this.height / (cols + 1);
    for (let col = 0; col < cols; col += 1) {
      for (let row = rows; row > 0; row -= 1) {
        const circleX = rowOffset * row;
        const circleY = colOffset * (col + 1);
        // 从上往下, 从右往左, 递减的绘制圆
        this.numberMap[`${circleX}_${circleY}`] = (cols - col) * rows - (rows - row);
        this.bgCtx.save();
        this.bgCtx.beginPath();
        this.bgCtx.moveTo(circleX + this.radius, circleY);
        this.bgCtx.arc(circleX, circleY, this.radius, 0, Math.PI * 2);
        this.bgCtx.strokeStyle = '#5b8c85';
        this.bgCtx.stroke();
        this.bgCtx.restore();
      }
    }
  }

  // calculate the coordinate of the hand relative to then container
  private calculateRelativeCoordinate(clientX: number, clientY: number): {
    relativeX: number;
    relativeY: number;
  } {
    let relativeX = 0;
    let relativeY = 0;

    if (clientX && clientY) {
      const { x: containerX, y: containerY } = this.container.getBoundingClientRect();
      relativeX = clientX - containerX;
      relativeY = clientY - containerY;
    }
    return {
      relativeX,
      relativeY,
    };
  }

  private clearInteraction(): void {
    this.interactionCtx.clearRect(0, 0, this.width, this.height);
  }

  private drawInteraction(clientX: number, clientY: number, color = 'black'): void {
    const {
      relativeX, relativeY,
    } = this.calculateRelativeCoordinate(clientX, clientY);

    this.calculateResult(relativeX, relativeY);

    this.drawInteractionNotLastLine(color);
    this.drawInteractionLastLine(relativeX, relativeY);
  }

  private calculateResult(relativeX: number, relativeY: number): void {
    const [rows, cols] = this.keyboard;
    const { width } = this;
    const { height } = this;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);

    // calculate whether the hand is in the circle
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const circleX = rowOffset * (row + 1);
        const circleY = colOffset * (col + 1);
        const isInCircle = Math.sqrt((relativeX - circleX) ** 2 + (relativeY - circleY) ** 2)
          - this.radius < 0;

        if (isInCircle && !this.resultCoordinates.includes(`${circleX}_${circleY}`)) {
          this.resultCoordinates.push(`${circleX}_${circleY}`);
          if (this.onChange) {
            const result = this.resultCoordinates.map((coordinate) => {
              const [x, y] = coordinate.split('_');
              return this.numberMap[`${x}_${y}`];
            });
            this.onChange(result);
          }
        }
      }
    }
  }

  private drawInteractionNotLastLine(color = 'black'): void {
    this.clearInteraction();
    this.drawInteractionCircle(color);
    this.drawInteractionConnectingLine(color);
  }

  private drawInteractionCircle(fillStyle = 'black'): void {
    this.resultCoordinates.forEach((coordinate) => {
      const [pointX, pointY] = coordinate.split('_');
      this.interactionCtx.save();
      this.interactionCtx.beginPath();
      this.interactionCtx.moveTo(+pointX + this.radius / 2, +pointY);
      this.interactionCtx.fillStyle = fillStyle;
      this.interactionCtx.arc(+pointX, +pointY, this.radius / 3, 0, Math.PI * 2);
      this.interactionCtx.fill();
      this.interactionCtx.restore();
    });
  }

  private drawInteractionConnectingLine(strokeStyle = 'black'): void {
    if (this.resultCoordinates.length === 0) {
      return;
    }
    const [firstPointX, firstPointY] = this.resultCoordinates[0].split('_');
    this.interactionCtx.save();
    this.interactionCtx.beginPath();
    this.interactionCtx.moveTo(+firstPointX, +firstPointY);
    this.resultCoordinates.forEach((coordinate, index) => {
      if (index === 0) {
        return;
      }
      const [pointX, pointY] = coordinate.split('_');
      this.interactionCtx.lineTo(+pointX, +pointY);
    });
    this.interactionCtx.strokeStyle = strokeStyle;
    this.interactionCtx.stroke();
    this.interactionCtx.restore();
  }

  private drawInteractionLastLine(relativeX: number, relativeY: number): void {
    if (this.resultCoordinates.length > 0) {
      const [lastPointX, lastPointY] = this.resultCoordinates[this.resultCoordinates.length - 1].split('_');
      this.interactionCtx.save();
      this.interactionCtx.beginPath();
      this.interactionCtx.moveTo(+lastPointX, +lastPointY);
      this.interactionCtx.lineTo(relativeX, relativeY);
      this.interactionCtx.strokeStyle = 'black';
      this.interactionCtx.stroke();
      this.interactionCtx.restore();
    }
  }

  private feedback(): void {
    const result = this.resultCoordinates.map((coordinate) => {
      const [x, y] = coordinate.split('_');
      return this.numberMap[`${x}_${y}`];
    });

    this.interactionCanvas.removeEventListener('touchmove', this.touchmove);
    this.drawInteractionNotLastLine();

    const callback = this.onResult && this.onResult(result);

    if (Object.prototype.toString.call(callback) === '[object Promise]') {
      this.checking();
      (callback as Promise<void>).then(() => this.success()).catch(() => this.error());
    }
  }

  private bindEvent(): void {
    this.interactionCanvas.addEventListener('touchstart', this.touchstart);
    this.interactionCanvas.addEventListener('touchend', this.touchend);
  }

  private unbindEvent(): void {
    this.interactionCanvas.removeEventListener('touchstart', this.touchstart);
    this.interactionCanvas.removeEventListener('touchend', this.touchend);
  }

  private touchstart(e: TouchEvent): void {
    // make it impossible to scroll while moving
    this.bodyOldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this.resultCoordinates = [];

    if (this.errorTimer) clearTimeout(this.errorTimer);

    const { clientX, clientY } = e.touches[0];
    this.drawInteraction(clientX, clientY);

    this.interactionCanvas.addEventListener('touchmove', this.touchmove);
  }

  private touchmove(e: TouchEvent): void {
    const { clientX, clientY } = e.touches[0];
    this.drawInteraction(clientX, clientY);
  }

  private touchend(): void {
    document.body.style.overflow = this.bodyOldOverflow;
    if (this.resultCoordinates.length > 0) {
      this.feedback();
    }
    this.interactionCanvas.removeEventListener('touchmove', this.touchmove);
  }

  public checking(): void {
    this.checkingCtx.clearRect(0, 0, this.width, this.height);
    this.checkingCanvas.style.display = 'block';

    const drawCheckCricle = (coordinates: string[]): void => {
      this.checkTimer = setTimeout(() => {
        if (coordinates.length === 0) {
          this.checkingCtx.clearRect(0, 0, this.width, this.height);
          drawCheckCricle(this.resultCoordinates.slice());
        } else {
          const coordinate: string = (coordinates.shift() as string);
          const [pointX, pointY] = coordinate.split('_');
          this.checkingCtx.save();
          this.checkingCtx.beginPath();
          this.checkingCtx.strokeStyle = '#21bf73';
          this.checkingCtx.lineWidth = 2;
          this.checkingCtx.moveTo(+pointX + this.radius, +pointY);
          this.checkingCtx.arc(+pointX, +pointY, this.radius, 0, Math.PI * 2);
          this.checkingCtx.stroke();
          this.checkingCtx.restore();
          drawCheckCricle(coordinates);
        }
      }, this.checkInterval);
    };

    drawCheckCricle(this.resultCoordinates.slice());
  }

  public error(): void {
    this.checkingCanvas.style.display = 'none';
    if (this.checkTimer) clearTimeout(this.checkTimer);
    this.drawInteractionNotLastLine('#fd5e53');
    this.errorTimer = setTimeout(() => {
      this.clearInteraction();
    }, this.errorDuration);
  }

  public success(): void {
    this.checkingCanvas.style.display = 'none';
    if (this.checkTimer) clearTimeout(this.checkTimer);
    this.resultCoordinates = [];
    this.clearInteraction();
  }

  public destroy(): void {
    this.unbindEvent();
    this.container.removeChild(this.bgCanvas);
    this.container.removeChild(this.interactionCanvas);
    this.container.removeChild(this.checkingCanvas);
  }
}

export default Lock;
