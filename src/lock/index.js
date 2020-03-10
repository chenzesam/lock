class Lock {
  constructor({
    container = null,
    keyborad = [3, 3],
    radius = 40,
    callback = result => {},
    errorDuration = 2000,
  } = {}) {
    this._container = container;
    this._errorDuration = errorDuration;
    this._errorTimer = null;
    this._keyboard = keyborad;
    this._radius = radius;
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
    const drawCanvas = document.createElement('canvas');

    this._width = this._container.getBoundingClientRect().width;
    this._height = this._container.getBoundingClientRect().height;

    bgCanvas.width = drawCanvas.width = this._width;
    bgCanvas.height = drawCanvas.height = this._height;
    bgCanvas.style.position = 'absolute';
    drawCanvas.style.position = 'absolute';

    this._bgCtx = bgCanvas.getContext('2d');
    this._drawCtx = drawCanvas.getContext('2d');

    this._bgCanvas = bgCanvas;
    this._drawCanvas = drawCanvas;

    this._container.appendChild(this._bgCanvas);
    this._container.appendChild(this._drawCanvas);

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
        this._numberMap[`${circleX}_${circleY}`] = (6 + row) - (col * 3);
        this._bgCtx.save();
        this._bgCtx.beginPath();
        this._bgCtx.moveTo(circleX + this._radius, circleY);
        this._bgCtx.arc(circleX, circleY, this._radius, 0, Math.PI * 2);
        this._bgCtx.stroke();
        this._bgCtx.restore();
      }
    }
  }

  _draw(clientX, clientY, color = 'black') {
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

    this._drawCtx.clearRect(0, 0, this._width, this._height);
    this._drawLine(clientX, clientY, color);
    this._drawCircle(color);
  }

  _drawCircle(fillStyle = 'black') {
    this._resultCoordinates.forEach(coordinate => {
      const [pointX, pointY] = coordinate.split('_');
      this._drawCtx.save();
      this._drawCtx.beginPath();
      this._drawCtx.moveTo(pointX + this._radius / 2, pointY);
      this._drawCtx.fillStyle = fillStyle;
      this._drawCtx.arc(pointX, pointY, this._radius / 3, 0, Math.PI * 2);
      this._drawCtx.fill();
      this._drawCtx.restore();
    });
  }

  _drawLine(clientX, clientY, strokeStyle = 'black') {
    if (this._resultCoordinates.length === 0) {
      return
    }
    const [pointX, pointY] = this._resultCoordinates[0].split('_');
      this._drawCtx.save();
      this._drawCtx.beginPath();
      this._drawCtx.moveTo(pointX, pointY);
      this._resultCoordinates.forEach((coordinate, index) => {
        if (index === 0) {
          return;
        }
        const [pointX, pointY] = coordinate.split('_');
        this._drawCtx.lineTo(pointX, pointY);
      });
      if (clientX !== null && clientY !== null) {
        this._drawCtx.lineTo(clientX, clientY);
      }
      this._drawCtx.strokeStyle = strokeStyle;
      this._drawCtx.stroke();
      this._drawCtx.restore();
  }

  _feedback() {
    const result = this._resultCoordinates.map(coordinate => {
      const [x, y] = coordinate.split('_');
      return this._numberMap[`${x}_${y}`];
    });
    this._drawCanvas.removeEventListener('touchmove', this._touchmove);
    this._draw();

    const self = this;
    const callback = this._callback(result);
    if (Object.prototype.toString.call(callback) === '[object Promise]') {
      console.log('Object.prototype.toString.call(callback)', Object.prototype.toString.call(callback))
      self.loading();
      callback.then(() => {
        self.success();
      }).catch(() => {
        self.error();
      })
    }
  }

  _bindEvent() {
    this._drawCanvas.addEventListener('touchstart', e => {
      this._resultCoordinates = [];
      const { clientX, clientY } = e.touches[0];
      if (this._errorTimer) {
        clearTimeout(this._errorTimer);
      }
      this._draw(clientX, clientY);
      this._isTouchstart = true;
      this._drawCanvas.addEventListener('touchmove', this._touchmove);
    })

    this._drawCanvas.addEventListener('touchend', () => {
      this._isTouchstart = false;
      this._feedback();
    })

  }

  _touchmove(e) {
    const { clientX, clientY } = e.touches[0];
    this._draw(clientX, clientY);
  }

  loading(text = 'checking...') {
    this._drawCtx.save();
    this._drawCtx.textAlign = 'center';
    this._drawCtx.font = '48px serif';
    this._drawCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this._drawCtx.fillRect(0, 0, this._width, this._height);
    this._drawCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    this._drawCtx.fillText(text, this._width / 2, this._height / 2)
    this._drawCtx.restore()
  }
  error() {
    this._draw(null, null, 'red');
    this._errorTimer = setTimeout(() => {
      this._drawCtx.clearRect(0, 0, this._width, this._height);
    }, this._errorDuration)
  }
  success() {
    this._resultCoordinates = [];
    this._drawCtx.clearRect(0, 0, this._width, this._height);
  }
}

export default Lock;

