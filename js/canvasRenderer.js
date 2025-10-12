(function(global){
  const CANVAS_W = 1920, CANVAS_H = 1080;

  function ensureSingleLine(str=''){
    return (str || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function drawText(ctx, text, x, y, font){
    ctx.font = font;            // "weight size family"
    ctx.fillStyle = '#ffffff';  // 白文字固定
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'transparent'; // 影なし
    ctx.fillText(ensureSingleLine(text), x, y);
  }

  async function renderToCanvas(img, fields){
    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');

    // 背景白でクリア
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // 画像 cover
    const r = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
    const dx = (CANVAS_W - dw)/2, dy = (CANVAS_H - dh)/2;
    ctx.drawImage(img, dx, dy, dw, dh);

    // 左半分に黒のグラデーション（箱ではなく直接）
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W * 0.7, 0);
    grad.addColorStop(0.00, 'rgba(0,0,0,0.60)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.40)');
    grad.addColorStop(0.70, 'rgba(0,0,0,0.00)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 文字（Noto Sans JP、行間は詰め気味）
    const left = 80;
    let y = 80;
    const fam = '"Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif';

    drawText(ctx, fields.jpName,  left, y, `700 60px ${fam}`);   y += 68;
    drawText(ctx, fields.company, left, y, `600 30px ${fam}`);   y += 40;
    drawText(ctx, fields.title,   left, y, `500 26px ${fam}`);

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
