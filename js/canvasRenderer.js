(function(global){
  const CANVAS_W = 1920, CANVAS_H = 1080;
  const PADDING = 80;

  function ensureSingleLine(str=''){
    return (str || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  /** 角丸矩形を描画 */
  function roundRect(ctx, x, y, w, h, r){
    const radius = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+radius, y);
    ctx.arcTo(x+w, y, x+w, y+h, radius);
    ctx.arcTo(x+w, y+h, x, y+h, radius);
    ctx.arcTo(x, y+h, x, y, radius);
    ctx.arcTo(x, y, x+w, y, radius);
    ctx.closePath();
  }

  function drawText(ctx, text, x, y, opts={}){
    const {
      font='28px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif',
      color='#ffffff' /* ← キャンバスは白文字 */,
      shadow=false     /* ← 文字影なし */
    } = opts;
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
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
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

    // 左上インフォパネル：半透明の黒、境界はフェード（shadowBlur）
    const panelX = PADDING - 20;
    const panelY = PADDING - 20;
    const panelW = 840;
    const panelH = 260;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';     // 外側に黒のぼかし影で境界をフェード
    ctx.shadowBlur  = 22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';       // 本体は黒半透明
    roundRect(ctx, panelX, panelY, panelW, panelH, 18);
    ctx.fill();
    ctx.restore();

    // テキスト（白、行間を詰める）
    const x = PADDING;
    let y = PADDING;
    drawText(ctx, fields.company, x, y, {font:'500 30px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif'});
    y += 40; // 行間コンパクト

    drawText(ctx, fields.jpName, x, y, {font:'700 34px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif'});
    y += 40;

    drawText(ctx, fields.enName, x, y, {font:'600 26px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif'});
    y += 34;

    drawText(ctx, fields.title,  x, y, {font:'500 24px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif'});
    y += 30;

    drawText(ctx, fields.email,  x, y, {font:'400 22px "Noto Sans JP", system-ui, -apple-system, Meiryo, sans-serif'});

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
