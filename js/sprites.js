const PALETTE = [
  null,
  '#ffffff',
  '#f2d2a9',
  '#4a3728',
  '#1a1a2e',
  '#d4564e',
  '#ff4757',
  '#6b4226',
  '#7ec8e3',
  '#e8e8e8',
  '#d4956a',
  '#ffb6c1',
  '#87ceeb',
];

const SPRITE_DATA = {
  nurse: {
    width: 14,
    pixels: [
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,6,1,1,1,1,0,0,0],
      [0,0,3,3,1,1,1,1,3,3,3,0,0,0],
      [0,0,3,3,3,3,3,3,3,3,3,3,0,0],
      [0,0,3,2,2,2,2,2,2,2,3,0,0,0],
      [0,0,3,2,4,2,2,2,4,2,3,0,0,0],
      [0,0,3,2,2,2,2,2,2,2,3,0,0,0],
      [0,0,3,2,2,5,5,2,2,2,3,0,0,0],
      [0,0,0,3,2,2,2,2,2,3,0,0,0,0],
      [0,0,0,0,2,2,2,2,2,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,6,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,2,1,1,1,1,1,1,1,1,1,2,0,0],
      [0,2,1,1,1,1,1,1,1,1,1,2,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,1,0,0,0,0],
      [0,0,0,7,7,0,0,7,7,7,0,0,0,0],
    ],
  },
  femalePatient: {
    width: 10,
    pixels: [
      [0,0,0,3,3,3,3,3,0,0],
      [0,0,3,3,3,3,3,3,3,0],
      [0,0,3,3,3,3,3,3,3,0],
      [0,0,3,2,2,2,2,2,3,0],
      [0,0,3,2,4,2,4,2,3,0],
      [0,0,3,2,2,2,2,2,3,0],
      [0,0,3,2,5,5,2,2,3,0],
      [0,0,0,3,2,2,2,3,0,0],
      [0,0,0,0,2,2,2,0,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,0,2,2,2,2,0,0,0],
      [0,0,0,7,7,7,7,0,0,0],
    ],
  },
  malePatient: {
    width: 10,
    pixels: [
      [0,0,0,0,3,3,3,0,0,0],
      [0,0,0,3,3,3,3,3,0,0],
      [0,0,0,3,3,3,3,3,0,0],
      [0,0,3,2,2,2,2,2,3,0],
      [0,0,3,2,4,2,4,2,3,0],
      [0,0,3,2,2,2,2,2,3,0],
      [0,0,3,2,5,5,2,2,3,0],
      [0,0,0,3,2,2,2,3,0,0],
      [0,0,0,0,2,2,2,0,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,8,8,8,8,8,8,0,0],
      [0,0,0,2,2,2,2,0,0,0],
      [0,0,0,7,7,7,7,0,0,0],
    ],
  },
};

const Sprites = {
  _typeTimer: null,
  _isTyping: false,
  _fullText: '',
  _onComplete: null,

  renderToCanvas(canvas, spriteKey, scale) {
    const data = SPRITE_DATA[spriteKey];
    if (!data) return;
    const rows = data.pixels;
    const w = data.width;
    const h = rows.length;
    scale = scale || 1;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ci = rows[y][x];
        if (ci === 0) continue;
        ctx.fillStyle = PALETTE[ci];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },

  createSpriteCanvas(spriteKey, scale) {
    const canvas = document.createElement('canvas');
    this.renderToCanvas(canvas, spriteKey, scale);
    return canvas;
  },

  showNurse() {
    const container = document.getElementById('speaker-sprite');
    container.innerHTML = '';
    const canvas = this.createSpriteCanvas('nurse', 5);
    canvas.className = 'sprite-canvas';
    container.appendChild(canvas);
    const nameEl = document.getElementById('speaker-name');
    nameEl.textContent = 'NURSE NANCY';
    nameEl.className = 'speaker-nurse';
  },

  showPatient(gender, name) {
    const container = document.getElementById('speaker-sprite');
    container.innerHTML = '';
    const key = gender === 'F' ? 'femalePatient' : 'malePatient';
    const canvas = this.createSpriteCanvas(key, 5);
    canvas.className = 'sprite-canvas';
    container.appendChild(canvas);
    const nameEl = document.getElementById('speaker-name');
    nameEl.textContent = name || 'NEW PATIENT';
    nameEl.className = gender === 'F' ? 'speaker-female' : 'speaker-male';
  },

  renderMiniSprite(container, gender, scale) {
    const key = gender === 'F' ? 'femalePatient' : 'malePatient';
    const canvas = this.createSpriteCanvas(key, scale || 2);
    canvas.className = 'mini-sprite-canvas';
    container.appendChild(canvas);
  },

  typeText(text, onComplete) {
    this._fullText = text;
    this._onComplete = onComplete || (() => {});
    this._isTyping = true;
    const el = document.getElementById('speech-text');
    const continueEl = document.getElementById('speech-continue');
    el.textContent = '';
    continueEl.style.visibility = 'hidden';
    let i = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
      } else {
        clearInterval(this._typeTimer);
        this._isTyping = false;
        continueEl.style.visibility = 'visible';
        this._onComplete();
      }
    }, 28);
  },

  isTyping() {
    return this._isTyping;
  },

  skipTyping() {
    clearInterval(this._typeTimer);
    this._isTyping = false;
    document.getElementById('speech-text').textContent = this._fullText;
    document.getElementById('speech-continue').style.visibility = 'visible';
    if (this._onComplete) this._onComplete();
  },

  clearSpeech() {
    clearInterval(this._typeTimer);
    this._isTyping = false;
    document.getElementById('speech-text').textContent = '';
    document.getElementById('speech-continue').style.visibility = 'hidden';
  },
};
