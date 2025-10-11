/* canvasRenderer.js
 * Draws a meeting background (1920x1080) with text overlays on an image.
 * Exported: renderToCanvas(image, fields), downloadCanvas(filename)
 */
(function(global){
  const CANVAS_W = 1920, CANVAS_H = 1080;
  const PADDING = 80;

  function ensureSingleLine(str=''){
    // Prevent newlines and collapse whitespace
    return (str || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function drawText(ctx, text, x, y, opts={}){
    const {font='28px/1.2 "Segoe UI", system-ui, -apple-system, Meiryo, sans-serif',
           color='#0f172a', shadow=true} = opts;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    if(shadow){
      ctx.shadowColor = 'rgba(0,0,0,.18)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.fillText(ensureSingleLine(text), x, y);
  }

  async function renderToCanvas(img, fields){
    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');
    // background white
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw background image (cover)
    const r = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
    const dx = (CANVAS_W - dw)/2, dy = (CANVAS_H - dh)/2;
    ctx.drawImage(img, dx, dy, dw, dh);

    // overlay block for better contrast
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(PADDING-20, PADDING-20, 820, 320);

    // draw texts
    drawText(ctx, fields.company, PADDING, PADDING, {font:'32px/1.25 "Segoe UI", system-ui, -apple-system, Meiryo, sans-serif'});
    drawText(ctx, fields.jpName, PADDING, PADDING+56, {font:'bold 36px/1.2 "Segoe UI", system-ui, Meiryo, sans-serif'});
    drawText(ctx, fields.enName, PADDING, PADDING+106, {font:'600 28px/1.2 "Segoe UI", system-ui, Meiryo, sans-serif', color:'#1f2937'});
    drawText(ctx, fields.title,  PADDING, PADDING+160, {font:'500 26px/1.2 "Segoe UI", system-ui, Meiryo, sans-serif', color:'#334155'});
    drawText(ctx, fields.email,  PADDING, PADDING+210, {font:'24px/1.2 "Segoe UI", system-ui, Meiryo, sans-serif', color:'#2563eb', shadow:false});

    return canvas;
  }

  function downloadCanvas(filename='MeetingBackground.jpg'){
    const canvas = document.getElementById('renderCanvas');
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  }

  global.CanvasRenderer = { renderToCanvas, downloadCanvas, ensureSingleLine };
})(window);
