type onResult = ((result: number[]) => void) | (() => Promise<void>);
type onChange = ((result: number[]) => void);

interface Config {
  container: HTMLElement;
  keyboard: [number, number];
  errorDuration?: number;
  onResult?: onResult;
  onChange?: onChange;
}

class Lock {
  private _container: HTMLElement;
  private _errorDuration?: number;
  private _errorTimer: number | null;
  private _checkTimer: NodeJS.Timeout | null;
  private _keyboard: [number, number];
  private _config: Config;
  private _onResult?: onResult;
  private _onChange?: onChange;

  // result collection
  private _resultCoordinates: string[] = [];
  private _numberMap: Record<string, number> = {};

  // record body overflow style
  private _bodyOldOverflow!: string;
  private _width: number;
  private _height: number;
  private _radius: number;

  private _bgCanvas: HTMLCanvasElement;
  private _interactionCanvas: HTMLCanvasElement;
  private _checkingCanvas: HTMLCanvasElement;

  private _bgCtx: CanvasRenderingContext2D;
  private _interactionCtx: CanvasRenderingContext2D;
  private _checkingCtx: CanvasRenderingContext2D;

  constructor(config: Config) {
    this._config = Object.assign({}, {
      keyboard: [3, 3],
      errorDuration: 2000,
    }, config);

    this._container = this._config.container;
    this._errorDuration = this._config.errorDuration;
    this._errorTimer = null;
    this._checkTimer = null;
    this._keyboard = this._config.keyboard;
    this._onResult = this._config.onResult;
    this._onChange = this._config.onChange;

    this._touchstart = this._touchstart.bind(this);
    this._touchend = this._touchend.bind(this);
    this._touchmove = this._touchmove.bind(this);

    // init
    this._container.style.position = 'relative';
    this._bgCanvas = document.createElement('canvas');
    this._interactionCanvas = document.createElement('canvas');
    this._checkingCanvas = document.createElement('canvas');

    this._width = this._container.getBoundingClientRect().width;
    this._height = this._container.getBoundingClientRect().height;
    this._checkingCanvas.width = this._bgCanvas.width = this._interactionCanvas.width = this._width;
    this._checkingCanvas.height = this._bgCanvas.height = this._interactionCanvas.height = this._height;

    this._bgCanvas.style.position = 'absolute';
    this._interactionCanvas.style.position = 'absolute';
    this._checkingCanvas.style.position = 'absolute';
    this._checkingCanvas.style.display = 'none';

    this._bgCtx = this._bgCanvas.getContext('2d') as CanvasRenderingContext2D;
    this._interactionCtx = this._interactionCanvas.getContext('2d') as CanvasRenderingContext2D;
    this._checkingCtx = this._checkingCanvas.getContext('2d') as CanvasRenderingContext2D;

    this._container.appendChild(this._bgCanvas);
    this._container.appendChild(this._interactionCanvas);
    this._container.appendChild(this._checkingCanvas);

    this._radius = (Math.min(this._width, this._height) / Math.max(...this._keyboard)) / 3;

    this._drawBg();
    this._bindEvent();
  }

  private _drawBg(): void {
    const [rows, cols] = this._keyboard;
    const rowOffset = this._width / (rows + 1);
    const colOffset = this._height / (cols + 1);
    for (let col = 0; col < cols; col++) {
      for (let row = rows; row > 0; row--) {
        const circleX = rowOffset * row;
        const circleY = colOffset * (col + 1);
        // 从上往下, 从右往左, 递减的绘制圆
        this._numberMap[`${circleX}_${circleY}`] = (cols - col) * rows - (rows - row);
        this._bgCtx.save();
        this._bgCtx.beginPath();
        this._bgCtx.moveTo(circleX + this._radius, circleY);
        this._bgCtx.arc(circleX, circleY, this._radius, 0, Math.PI * 2);
        this._bgCtx.strokeStyle = '#5b8c85';
        this._bgCtx.stroke();
        this._bgCtx.restore();
      }
    }
  }

  // calculate the coordinate of the hand relative to then container
  private _calculateRelativeCoordinate(clientX: number, clientY: number): {
    relativeX: number;
    relativeY: number;
  } {
    let relativeX = 0;
    let relativeY = 0;

    if (clientX && clientY) {
      const { x: containerX, y: containerY } = this._container.getBoundingClientRect();
      relativeX = clientX - containerX;
      relativeY = clientY - containerY;
    }
    return {
      relativeX,
      relativeY
    }
  }

  private _clearInteraction(): void {
    this._interactionCtx.clearRect(0, 0, this._width, this._height);
  }

  private _drawInteraction(clientX: number, clientY: number, color = 'black'): void {

    const {
      relativeX, relativeY
    } = this._calculateRelativeCoordinate(clientX, clientY);

    this._calculateResult(relativeX, relativeY);

    this._drawInteractionNotLastLine(color);
    this._drawInteractionLastLine(relativeX, relativeY);
  }

  private _calculateResult(relativeX: number, relativeY: number): void {
    const [rows, cols] = this._keyboard;
    const width = this._width;
    const height = this._height;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);

    // calculate whether the hand is in the circle
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const circleX = rowOffset * (row + 1);
        const circleY = colOffset * (col + 1);
        const isInCircle = Math.sqrt(Math.pow(relativeX - circleX, 2) + Math.pow(relativeY - circleY, 2)) - this._radius < 0;
        if (isInCircle && !this._resultCoordinates.includes(`${circleX}_${circleY}`)) {
          this._resultCoordinates.push(`${circleX}_${circleY}`);

          if (this._onChange) {
            const result = this._resultCoordinates.map(coordinate => {
              const [x, y] = coordinate.split('_');
              return this._numberMap[`${x}_${y}`];
            });
            this._onChange(result);
          }
        }
      }
    }
  }

  private _drawInteractionNotLastLine(color = 'black'): void {
    this._clearInteraction();
    this._drawInteractionCircle(color);
    this._drawInteractionConnectingLine(color);
  }

  private _drawInteractionCircle(fillStyle = 'black'): void {
    this._resultCoordinates.forEach(coordinate => {
      const [pointX, pointY] = coordinate.split('_');
      this._interactionCtx.save();
      this._interactionCtx.beginPath();
      this._interactionCtx.moveTo(+pointX + this._radius / 2, +pointY);
      this._interactionCtx.fillStyle = fillStyle;
      this._interactionCtx.arc(+pointX, +pointY, this._radius / 3, 0, Math.PI * 2);
      this._interactionCtx.fill();
      this._interactionCtx.restore();
    });
  }

  private _drawInteractionConnectingLine(strokeStyle = 'black'): void {
    if (this._resultCoordinates.length === 0) {
      return
    }
    const [pointX, pointY] = this._resultCoordinates[0].split('_');
    this._interactionCtx.save();
    this._interactionCtx.beginPath();
    this._interactionCtx.moveTo(+pointX, +pointY);
    this._resultCoordinates.forEach((coordinate, index) => {
      if (index === 0) {
        return;
      }
      const [pointX, pointY] = coordinate.split('_');
      this._interactionCtx.lineTo(+pointX, +pointY);
    });
    this._interactionCtx.strokeStyle = strokeStyle;
    this._interactionCtx.stroke();
    this._interactionCtx.restore();
  }

  private _drawInteractionLastLine(relativeX: number, relativeY: number): void {
    if (this._resultCoordinates.length > 0) {
      const [lastPointX, lastPointY] = this._resultCoordinates[this._resultCoordinates.length - 1].split('_');
      this._interactionCtx.save();
      this._interactionCtx.beginPath();
      this._interactionCtx.moveTo(+lastPointX, +lastPointY);
      this._interactionCtx.lineTo(relativeX, relativeY);
      this._interactionCtx.strokeStyle = 'black';
      this._interactionCtx.stroke();
      this._interactionCtx.restore();
    }
  }

  private _feedback(): void {

    const result = this._resultCoordinates.map(coordinate => {
      const [x, y] = coordinate.split('_');
      return this._numberMap[`${x}_${y}`];
    });

    this._interactionCanvas.removeEventListener('touchmove', this._touchmove);
    this._drawInteractionNotLastLine();

    const callback = this._onResult && this._onResult(result);

    if (Object.prototype.toString.call(callback) === '[object Promise]') {
      this.checking();
      (callback as Promise<void>).then(() => this.success()).catch(() => this.error())
    }
  }

  private _bindEvent(): void {
    this._interactionCanvas.addEventListener('touchstart', this._touchstart)
    this._interactionCanvas.addEventListener('touchend', this._touchend)
  }

  private _unbindEvent(): void {
    this._interactionCanvas.removeEventListener('touchstart', this._touchstart)
    this._interactionCanvas.removeEventListener('touchend', this._touchend)
  }

  private _touchstart(e: TouchEvent): void {
    // make it impossible to scroll while moving
    this._bodyOldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this._resultCoordinates = [];
    const { clientX, clientY } = e.touches[0];
    if (this._errorTimer) {
      clearTimeout(this._errorTimer);
    }
    this._drawInteraction(clientX, clientY);
    this._interactionCanvas.addEventListener('touchmove', this._touchmove);
  }

  private _touchmove(e: TouchEvent): void {
    const { clientX, clientY } = e.touches[0];
    this._drawInteraction(clientX, clientY);
  }

  private _touchend(): void {
    document.body.style.overflow = this._bodyOldOverflow;
    if (this._resultCoordinates.length > 0) {
      this._feedback();
    }
    this._interactionCanvas.removeEventListener('touchmove', this._touchmove);
  }

  public checking(): void {
    this._checkingCtx.clearRect(0, 0, this._width, this._height);
    this._checkingCanvas.style.display = 'block';

    const drawCheckCricle = (coordinates: string[]): void => {
      this._checkTimer = setTimeout(() => {
        if (coordinates.length === 0) {
          this._checkingCtx.clearRect(0, 0, this._width, this._height);
          drawCheckCricle(this._resultCoordinates.slice());
        } else {
          const coordinate: string = (coordinates.shift() as string);
          const [pointX, pointY] = coordinate.split('_');
          this._checkingCtx.save();
          this._checkingCtx.beginPath();
          this._checkingCtx.strokeStyle = '#21bf73';
          this._checkingCtx.lineWidth = 2;
          this._checkingCtx.moveTo(+pointX + this._radius, +pointY);
          this._checkingCtx.arc(+pointX, +pointY, this._radius, 0, Math.PI * 2);
          this._checkingCtx.stroke();
          this._checkingCtx.restore();
          drawCheckCricle(coordinates);
        }
      }, 150)
    }

    drawCheckCricle(this._resultCoordinates.slice());
  }

  public error(): void {
    this._checkingCanvas.style.display = 'none';
    clearTimeout((this._checkTimer as NodeJS.Timeout));
    this._drawInteractionNotLastLine('#fd5e53');
    this._errorTimer = setTimeout(() => {
      this._clearInteraction();
    }, this._errorDuration);
  }

  public success(): void {
    this._checkingCanvas.style.display = 'none';
    clearTimeout(this._checkTimer as NodeJS.Timeout);
    this._resultCoordinates = [];
    this._clearInteraction();
  }

  public destroy(): void {
    this._unbindEvent();
    this._container.removeChild(this._bgCanvas)
    this._container.removeChild(this._interactionCanvas)
    this._container.removeChild(this._checkingCanvas)
  }
}

export default Lock;

