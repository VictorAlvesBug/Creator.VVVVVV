CanvasRenderingContext2D.prototype.drawLine = function (
  x1,
  y1,
  x2,
  y2,
  options
) {
  this.strokeStyle = options.color ?? '#f00';
  this.lineWidth = options.lineWidth ?? 3;
  this.beginPath();
  this.moveTo(x1, y1);
  this.lineTo(x2, y2);
  this.stroke();
};

CanvasRenderingContext2D.prototype.drawRect = function (
  left,
  top,
  width,
  height,
  options
) {
  if(!options.fillColor && !options.borderColor){
    this.strokeStyle = "#f00";
    this.lineWidth = options.lineWidth ?? 3;
    
    this.beginPath();
    this.rect(left, top, width, height);

    this.stroke();
  }
  else{
    this.fillStyle = options.fillColor ?? '#000';
    this.strokeStyle = options.borderColor ?? "#f00";
    this.lineWidth = options.lineWidth ?? 3;
    
    this.beginPath();
    this.rect(left, top, width, height);

    options.fillColor && this.fill();
    options.borderColor && this.stroke();
  }
};

CanvasRenderingContext2D.prototype.drawTriangle = function (
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  options
) {
  if(!options.fillColor && !options.borderColor){
    this.strokeStyle = "#f00";
    this.lineWidth = options.lineWidth ?? 3;
    
    this.beginPath();
    this.rect(left, top, width, height);

    this.stroke();
  }
  else{
    this.fillStyle = options.fillColor ?? '#000';
    this.strokeStyle = options.borderColor ?? "#f00";
    this.lineWidth = options.lineWidth ?? 3;
    
    this.beginPath();
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.lineTo(x3, y3);
    this.lineTo(x1, y1);

    options.fillColor && this.fill();
    options.borderColor && this.stroke();
  }
};