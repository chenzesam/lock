class Lock {
  constructor({
    container = null,
    keyborad = [3, 3],
    callback = result => {},
    errorDuration = 2000,
  } = {}) {
    this._container = container;
    this._errorDuration = errorDuration;
    this._errorTimer = null;
    this._keyboard = keyborad;
    this._callback = callback;

    // {[key: string]: number} 坐标和数字键盘的映射表
    this._numberMap = {};

    // string[], 结果集
    this._resultCoordinates = [];
    this._touchmove = this._touchmove.bind(this);

    this._init();
  }

  _init() {
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

    this._bgCtx = bgCanvas.getContext('2d');
    this._interactionCtx = interactionCanvas.getContext('2d');

    this._bgCanvas = bgCanvas;
    this._interactionCanvas = interactionCanvas;

    this._container.appendChild(this._bgCanvas);
    this._container.appendChild(this._interactionCanvas);

    this._drawBg();
    this._bindEvent();
  }

  _drawBg() {
    const [rows, cols] = this._keyboard;
    const width = this._width;
    const height = this._height;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);
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

  _drawInteraction(clientX, clientY, color = 'black') {
    const [rows, cols] = this._keyboard;
    const width = this._width;
    const height = this._height;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);

    // 计算鼠标坐标是否在圆内
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const circleX = rowOffset * (row + 1);
        const circleY = colOffset * (col + 1);
        const isInCircle = Math.sqrt(Math.pow(clientX - circleX, 2) + Math.pow(clientY - circleY, 2)) - this._radius < 0;
        if (isInCircle && !this._resultCoordinates.includes(`${circleX}_${circleY}`)) {
          this._resultCoordinates.push(`${circleX}_${circleY}`);
        }
      }
    }

    this._clearInteraction();
    this._drawInteractionLine(clientX, clientY, color);
    this._drawInteractionCircle(color);
  }

  _clearInteraction() {
    this._interactionCtx.clearRect(0, 0, this._width, this._height);
  }

  _drawInteractionCircle(fillStyle = 'black') {
    this._resultCoordinates.forEach(coordinate => {
      const [pointX, pointY] = coordinate.split('_');
      this._interactionCtx.save();
      this._interactionCtx.beginPath();
      this._interactionCtx.moveTo(pointX + this._radius / 2, pointY);
      this._interactionCtx.fillStyle = fillStyle;
      this._interactionCtx.arc(pointX, pointY, this._radius / 3, 0, Math.PI * 2);
      this._interactionCtx.fill();
      this._interactionCtx.restore();
    });
  }

  _drawInteractionLine(clientX, clientY, strokeStyle = 'black') {
    if (this._resultCoordinates.length === 0) {
      return
    }
    const [pointX, pointY] = this._resultCoordinates[0].split('_');
      this._interactionCtx.save();
      this._interactionCtx.beginPath();
      this._interactionCtx.moveTo(pointX, pointY);
      this._resultCoordinates.forEach((coordinate, index) => {
        if (index === 0) {
          return;
        }
        const [pointX, pointY] = coordinate.split('_');
        this._interactionCtx.lineTo(pointX, pointY);
      });
      if (clientX !== null && clientY !== null) {
        this._interactionCtx.lineTo(clientX, clientY);
      }
      this._interactionCtx.strokeStyle = strokeStyle;
      this._interactionCtx.stroke();
      this._interactionCtx.restore();
  }

  _feedback() {

    const result = this._resultCoordinates.map(coordinate => {
      const [x, y] = coordinate.split('_');
      return this._numberMap[`${x}_${y}`];
    });

    this._interactionCanvas.removeEventListener('touchmove', this._touchmove);
    this._drawInteraction();

    const self = this;
    const callback = this._callback(result);

    if (Object.prototype.toString.call(callback) === '[object Promise]') {
      self.loading();
      callback.then(() => {
        self.success();
      }).catch(() => {
        self.error();
      })
    }
  }

  _bindEvent() {
    this._interactionCanvas.addEventListener('touchstart', e => {
      this._resultCoordinates = [];

      const { clientX, clientY } = e.touches[0];

      if (this._errorTimer) {
        clearTimeout(this._errorTimer);
      }
      this._drawInteraction(clientX, clientY);
      this._isTouchstart = true;
      this._interactionCanvas.addEventListener('touchmove', this._touchmove);
    })

    this._interactionCanvas.addEventListener('touchend', () => {
      this._isTouchstart = false;
      if (this._resultCoordinates.length > 0) {
        this._feedback();
      }
    })

  }

  _touchmove(e) {
    const { clientX, clientY } = e.touches[0];
    this._drawInteraction(clientX, clientY);
  }

  loading(text = 'checking...') {
    this._interactionCtx.save();
    this._interactionCtx.textAlign = 'center';
    this._interactionCtx.font = '48px serif';
    this._interactionCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this._interactionCtx.fillRect(0, 0, this._width, this._height);
    this._interactionCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    this._interactionCtx.fillText(text, this._width / 2, this._height / 2)
    this._interactionCtx.restore()
  }

  error() {
    this._drawInteraction(null, null, 'red');
    this._errorTimer = setTimeout(() => {
      this._clearInteraction();
    }, this._errorDuration);
  }

  success() {
    this._resultCoordinates = [];
    this._clearInteraction();
  }
}

export default Lock;

