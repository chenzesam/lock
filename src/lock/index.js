class Lock {
  constructor({
    container = null,
    keyborad = [3, 3],
    radius = 40,
    callback = result => {}
  } = {}) {

    this._container = container;
    this._keyboard = keyborad;
    this._radius = radius;
    this._callback = callback;

    // {[key: string]: number} 坐标和数字键盘的映射表
    this._numberMap = {};

    // string[], 结果集
    this._resultCoordinates = [];
    this._mousemove = this._mousemove.bind(this);

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

  _draw(clientX, clientY) {
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
    this._drawLine(clientX, clientY);
    this._drawCircle();
  }

  _drawCircle() {
    this._resultCoordinates.forEach(coordinate => {
      const [pointX, pointY] = coordinate.split('_');
      this._drawCtx.save();
      this._drawCtx.beginPath();
      this._drawCtx.moveTo(pointX + this._radius / 2, pointY);
      const radialGradient = this._drawCtx.createRadialGradient(
        pointX, pointY, 0,
        pointX, pointY, this._radius / 2,
      );
      radialGradient.addColorStop(0, '#000');
      radialGradient.addColorStop(0.5, '#fff');
      radialGradient.addColorStop(1, '#000');
      this._drawCtx.fillStyle = radialGradient;
      this._drawCtx.arc(pointX, pointY, this._radius / 2, 0, Math.PI * 2);
      this._drawCtx.fill();
      this._drawCtx.restore();
    });
  }

  _drawLine(clientX, clientY) {
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
      this._drawCtx.lineTo(clientX, clientY);
      this._drawCtx.stroke();
      this._drawCtx.restore();
  }

  _feedback() {
    this._drawCanvas.removeEventListener('mousemove', this._mousemove);
    this._drawCtx.clearRect(0, 0, this._width, this._height);
    this._callback(this._resultCoordinates.map(coordinate => {
      const [x, y] = coordinate.split('_');
      return this._numberMap[`${x}_${y}`];
    }));
    this._resultCoordinates = [];
  }

  _bindEvent() {

    this._drawCanvas.addEventListener('mousedown', e => {
      const { clientX, clientY } = e;
      this._draw(clientX, clientY);
      this._isMouseDown = true;
      this._drawCanvas.addEventListener('mousemove', this._mousemove);
    })

    this._drawCanvas.addEventListener('mouseup', () => {
      this._isMouseDown = false;
      this._feedback();
    })

    this._drawCanvas.addEventListener('mouseleave', () => {
      if (this._isMouseDown) {
        this._isMouseDown = false;
        this._feedback();
      }
    })
  }

  _mousemove(e) {
    const { clientX, clientY } = e;
    this._draw(clientX, clientY);
  }
}

export default Lock;

