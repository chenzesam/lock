class Lock {
  constructor({
    container = null,
    keyborad = [3, 3],
    radius = 40
  } = {}) {
    this._container = container;
    this._keyborad = keyborad;
    this._radius = radius;
    this._mousemove = this._mousemove.bind(this);
    this._result = [];
    this._init();
  }

  _init() {
    const canvas = document.createElement('canvas');
    canvas.width = this._container.getBoundingClientRect().width;
    canvas.height = this._container.getBoundingClientRect().height;
    this._ctx = canvas.getContext('2d');

    this._canvas = canvas;
    this._container.appendChild(this._canvas);

    this._drawCircle();
    this._bindEvent();
  }

  _drawCircle() {
    const [rows, cols] = this._keyborad;
    const width = this._canvas.width;
    const height = this._canvas.height;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this._ctx.moveTo(rowOffset * (row + 1) + this._radius, colOffset * (col + 1));
        this._ctx.arc(rowOffset * (row + 1), colOffset * (col + 1), this._radius, 0, Math.PI * 2);
      }
    }
    this._ctx.stroke();
  }

  _highlightCircle(clientX, clientY) {
    const [rows, cols] = this._keyborad;
    const width = this._canvas.width;
    const height = this._canvas.height;
    const rowOffset = width / (rows + 1);
    const colOffset = height / (cols + 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const circleX = rowOffset * (row + 1);
        const circleY = colOffset * (col + 1);
        const isInCircle = Math.sqrt(Math.pow(clientX - circleX, 2) + Math.pow(clientY - circleY, 2)) - this._radius < 0;
        if (isInCircle) {
          this._ctx.save();
          this._ctx.beginPath();
          this._ctx.clearRect(circleX - this._radius, circleY - this._radius, this._radius * 2, this._radius * 2);
          this._ctx.strokeStyle = 'red';
          this._ctx.moveTo(rowOffset * (row + 1) + this._radius, colOffset * (col + 1));
          this._ctx.arc(rowOffset * (row + 1), colOffset * (col + 1), this._radius, 0, Math.PI * 2);
          this._ctx.stroke();
          this._ctx.restore();
        }
      }
    }
  }

  _bindEvent() {
    this._canvas.addEventListener('mousedown', e => {
      const { clientX, clientY } = e;
      this._highlightCircle(clientX, clientY)
      this._isMouseDown = true;
      this._canvas.addEventListener('mousemove', this._mousemove);
    })

    this._canvas.addEventListener('mouseup', e => {
      this._canvas.removeEventListener('mousemove', this._mousemove);
      this._isMouseDown = false;
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      this._drawCircle();
    })
  }
  _mousemove(e) {
    const { clientX, clientY } = e;
    this._highlightCircle(clientX, clientY);
  }
}

export default Lock;

