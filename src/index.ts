interface Config {
  container: HTMLElement;
  keyboard: [number, number];
  errorDuration: number;
  onResult: (result: number[]) => void | null;
  onChange: (result: number[]) => void | null;
}

class Lock {
  private _container: HTMLElement;
  private _errorDuration: number;
  private _errorTimer: NodeJS.Timeout | null;
  private _keyboard: [number, number];
  private _config: Config;
  private _onResult: (result: number[]) => void | null | Promise<void>;
  private _onChange: (result: number[]) => void | null;

  // result collection
  private _resultCoordinates: string[] = [];
  private _numberMap: {
    [key: string]: number;
  } = {};

  // record body overflow style
  private _bodyOldOverflow = '';
  private _width = 0;
  private _height = 0;
  private _radius = 0;
  private _bgCanvas: HTMLCanvasElement;
  private _interactionCanvas: HTMLCanvasElement;
  private _bgCtx: CanvasRenderingContext2D;
  private _interactionCtx: CanvasRenderingContext2D;

  constructor(config: Config) {
    this._config = Object.assign({}, {
      keyboard: [3, 3],
      errorDuration: 2000,
    }, config);


    this._container = this._config.container;
    this._errorDuration = this._config.errorDuration;
    this._errorTimer = null;
    this._keyboard = this._config.keyboard;
    this._onResult = this._config.onResult;
    this._onChange = this._config.onChange;

    this._touchmove = this._touchmove.bind(this);

    // init
    this._container.style.position = 'relative';
    const bgCanvas = document.createElement('canvas');
    const interactionCanvas = document.createElement('canvas');
    this._width = this._container.getBoundingClientRect().width;
    this._height = this._container.getBoundingClientRect().height;
    this._radius = (Math.min(this._width, this._height) / Math.max(...this._keyboard)) / 3;
    bgCanvas.width = interactionCanvas.width = this._width;
    bgCanvas.height = interactionCanvas.height = this._height;
    bgCanvas.style.position = 'absolute';
    interactionCanvas.style.position = 'absolute';

    this._bgCtx = bgCanvas.getContext('2d') as CanvasRenderingContext2D;
    this._interactionCtx = interactionCanvas.getContext('2d') as CanvasRenderingContext2D;

    this._bgCanvas = bgCanvas;
    this._interactionCanvas = interactionCanvas;

    this._container.appendChild(this._bgCanvas);
    this._container.appendChild(this._interactionCanvas);

    this._drawBg();
    this._bindEvent();
  }
  _drawBg(): void {
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
        this._bgCtx.stroke();
        this._bgCtx.restore();
      }
    }
  }

  // calculate the coordinate of the hand relative to then container
  _calculateRelativeCoordinate(clientX: number, clientY: number): {
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

  _clearInteraction(): void {
    this._interactionCtx.clearRect(0, 0, this._width, this._height);
  }

  _drawInteraction(clientX: number, clientY: number, color = 'black'): void {

    const {
      relativeX, relativeY
    } = this._calculateRelativeCoordinate(clientX, clientY);

    this._calculateResult(relativeX, relativeY);

    this._drawInteractionNotLastLine(color);
    this._drawInteractionLastLine(relativeX, relativeY);
  }

  _calculateResult(relativeX: number, relativeY: number): void {
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

  _drawInteractionNotLastLine(color = 'black'): void {
    this._clearInteraction();
    this._drawInteractionCircle(color);
    this._drawInteractionConnectingLine(color);
  }

  _drawInteractionCircle(fillStyle = 'black'): void {
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

  _drawInteractionConnectingLine(strokeStyle = 'black'): void {
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

  _drawInteractionLastLine(relativeX: number, relativeY: number): void {
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

  _feedback(): void {

    const result = this._resultCoordinates.map(coordinate => {
      const [x, y] = coordinate.split('_');
      return this._numberMap[`${x}_${y}`];
    });

    this._interactionCanvas.removeEventListener('touchmove', this._touchmove);
    this._drawInteractionNotLastLine();

    const callback = this._onResult && this._onResult(result) as Promise<void>;

    const doSuccess = (): void => this.success();
    const doError = (): void => this.error();
    if (Object.prototype.toString.call(callback) === '[object Promise]') {
      this.loading();
      callback.then(doSuccess).catch(doError)
    }
  }

  _bindEvent(): void {
    this._interactionCanvas.addEventListener('touchstart', e => {
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
    })

    this._interactionCanvas.addEventListener('touchend', () => {
      document.body.style.overflow = this._bodyOldOverflow;
      if (this._resultCoordinates.length > 0) {
        this._feedback();
      }
    })

  }

  _touchmove(e: TouchEvent): void{
    const { clientX, clientY } = e.touches[0];
    this._drawInteraction(clientX, clientY);
  }

  public loading(text = 'checking...'): void {
    this._interactionCtx.save();
    this._interactionCtx.textAlign = 'center';
    this._interactionCtx.font = '48px serif';
    this._interactionCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this._interactionCtx.fillRect(0, 0, this._width, this._height);
    this._interactionCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    this._interactionCtx.fillText(text, this._width / 2, this._height / 2)
    this._interactionCtx.restore()
  }

  public error(): void {
    this._drawInteractionNotLastLine('red');
    this._errorTimer = setTimeout(() => {
      this._clearInteraction();
    }, this._errorDuration);
  }

  public success(): void {
    this._resultCoordinates = [];
    this._clearInteraction();
  }
}

export default Lock;

