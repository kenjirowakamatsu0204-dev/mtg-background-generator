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

  async function loadPendoLogo(){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      // SVGをDataURLとして読み込む
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="#F94877"/>
        <!-- 右斜め上を指す矢印のような形状 -->
        <path d="M25 70 L25 50 L40 35 L55 35 L55 40 L45 40 L45 50 L60 50 L60 55 L45 55 L45 65 L70 65 L70 70 Z" fill="white"/>
      </svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      img.src = url;
    });
  }

  async function renderToCanvas(img, fields, showLogo = false){
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
    
    // 会社名を描画
    drawText(ctx, fields.company, left, y, `600 30px ${fam}`);
    
    // ロゴを描画（会社名の右横）
    if(showLogo){
      const logoImg = await loadPendoLogo();
      const logoSize = 40; // ロゴのサイズ（ピクセル）
      const companyWidth = ctx.measureText(ensureSingleLine(fields.company)).width;
      const logoX = left + companyWidth + 16; // 会社名の右に16pxの間隔
      // 会社名のフォントサイズは30pxなので、ロゴを中央揃えにするために調整
      const logoY = y + (30 - logoSize) / 2; // 会社名の中央に配置
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }
    
    y += 40;
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
