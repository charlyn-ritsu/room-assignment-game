const Game = {
  state: {
    phase: 'title',
    currentLevel: 0,
    beds: {},
    newPatients: [],
    dialogueIndex: 0,
    rosterVisible: false,
    patientsVisible: false,
    skipDialogue: false,
  },

  init() {
    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('replay-btn').addEventListener('click', () => this.resetGame());
    document.getElementById('dialogue-area').addEventListener('click', () => this.advanceDialogue());
    document.getElementById('game-screen').addEventListener('click', (e) => {
      if (this.state.phase === 'splash' && !e.target.closest('#progress-bar')) {
        Animations.skipLevelTitle();
        return;
      }
      if (this.state.phase === 'dialogue' && !e.target.closest('#dialogue-area')) {
        this.advanceDialogue();
      }
    });
    document.getElementById('progress-bar').addEventListener('click', (e) => {
      const dot = e.target.closest('.progress-level');
      if (!dot) return;
      const lvl = parseInt(dot.dataset.level) - 1;
      if (lvl >= 0 && lvl < LEVELS.length && lvl !== this.state.currentLevel) {
        this.jumpToLevel(lvl);
      }
    });
    document.getElementById('skip-checkbox').addEventListener('change', (e) => {
      this.state.skipDialogue = e.target.checked;
      if (e.target.checked && this.state.phase === 'dialogue') {
        this.skipAllDialogue();
      }
    });
  },

  startGame() {
    this.state.currentLevel = 0;
    Animations.hideScreen('title-screen', () => {
      Animations.showScreen('game-screen', () => {
        this.loadLevel(0);
      });
    });
  },

  resetGame() {
    Animations.hideScreen('victory-screen', () => {
      Animations.showScreen('title-screen');
    });
  },

  jumpToLevel(levelIndex) {
    DragManager.disable();
    Sprites.clearSpeech();
    const overlay = document.querySelector('.level-complete-overlay');
    if (overlay) overlay.remove();
    const lt = document.getElementById('level-title');
    gsap.killTweensOf(lt);
    lt.style.display = 'none';
    const notif = document.getElementById('notification');
    notif.classList.remove('visible');
    notif.classList.add('hidden');
    this.loadLevel(levelIndex);
  },

  loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    if (!level) {
      this.showVictory();
      return;
    }

    this.state.currentLevel = levelIndex;
    this.state.phase = 'splash';
    this.state.dialogueIndex = 0;
    document.getElementById('game-screen').classList.remove('dialogue-active');
    this.state.rosterVisible = false;
    this.state.patientsVisible = false;
    DragManager.disable();

    this.state.beds = {};
    level.beds.forEach((bed) => {
      this.state.beds[bed.id] = {
        id: bed.id,
        room: bed.room,
        type: bed.type,
        patient: bed.patient ? { ...bed.patient } : null,
      };
    });

    this.state.newPatients = level.newPatients.map((p) => ({
      ...p,
      placed: false,
      currentBed: null,
    }));

    this.updateProgress();
    Animations.resetGameArea();

    if (this.state.skipDialogue) {
      const area = document.getElementById('dialogue-area');
      area.classList.remove('hidden');
      area.style.opacity = '1';
      this.skipAllDialogue();
      return;
    }

    Animations.showLevelTitle(level.title, level.subtitle, () => {
      Animations.showDialogue(() => {
        this.state.phase = 'dialogue';
        document.getElementById('game-screen').classList.add('dialogue-active');
        this.showCurrentDialogue();
      });
    });
  },

  updateProgress() {
    document.querySelectorAll('.progress-level').forEach((dot) => {
      const lvl = parseInt(dot.dataset.level) - 1;
      dot.classList.remove('completed', 'current');
      if (lvl < this.state.currentLevel) dot.classList.add('completed');
      else if (lvl === this.state.currentLevel) dot.classList.add('current');
    });
  },

  showCurrentDialogue() {
    const level = LEVELS[this.state.currentLevel];
    const line = level.dialogue[this.state.dialogueIndex];

    if (!line) {
      this.state.phase = 'playing';
      document.getElementById('game-screen').classList.remove('dialogue-active');
      // #region agent log
      fetch('http://127.0.0.1:7329/ingest/b76c846e-f8cc-447c-bbf0-bb4b07eb3c7a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1bfdd'},body:JSON.stringify({sessionId:'c1bfdd',location:'game.js:phase-playing',message:'Phase set to playing',data:{dialogueIndex:this.state.dialogueIndex,dragEnabled:DragManager.enabled},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
      // #endregion
      return;
    }

    if (line.speaker === 'nurse') {
      Sprites.showNurse();
    } else if (line.speaker === 'patient') {
      const patient = level.newPatients[line.patientIndex || 0];
      Sprites.showPatient(patient.gender, patient.name.split(' ')[0].toUpperCase());
    }

    Sprites.typeText(line.text, () => {
      if (line.action === 'showRoster') {
        this.renderRoster();
        Animations.slideInRoster();
        this.state.rosterVisible = true;
      }
      if (line.action === 'enableDrag') {
        this.renderNewPatients();
        Animations.slideInPatients();
        this.state.patientsVisible = true;
        DragManager.enable();
        // #region agent log
        fetch('http://127.0.0.1:7329/ingest/b76c846e-f8cc-447c-bbf0-bb4b07eb3c7a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1bfdd'},body:JSON.stringify({sessionId:'c1bfdd',location:'game.js:enableDrag-action',message:'enableDrag action fired',data:{dragManagerEnabled:DragManager.enabled,patientsVisible:this.state.patientsVisible},timestamp:Date.now(),hypothesisId:'H-A-fix'})}).catch(()=>{});
        // #endregion
      }
    });
  },

  advanceDialogue() {
    if (this.state.phase !== 'dialogue') return;

    if (Sprites.isTyping()) {
      Sprites.skipTyping();
      return;
    }

    this.state.dialogueIndex++;
    this.showCurrentDialogue();
  },

  skipAllDialogue() {
    const level = LEVELS[this.state.currentLevel];
    Sprites.clearSpeech();

    level.dialogue.forEach((line) => {
      if (line.action === 'showRoster' && !this.state.rosterVisible) {
        this.renderRoster();
        const panel = document.getElementById('roster-panel');
        panel.classList.remove('hidden');
        panel.style.opacity = '1';
        this.state.rosterVisible = true;
      }
      if (line.action === 'enableDrag' && !this.state.patientsVisible) {
        this.renderNewPatients();
        const panel = document.getElementById('patient-panel');
        panel.classList.remove('hidden');
        panel.style.opacity = '1';
        this.state.patientsVisible = true;
        DragManager.enable();
      }
    });

    const lastLine = level.dialogue[level.dialogue.length - 1];
    if (lastLine) {
      if (lastLine.speaker === 'nurse') {
        Sprites.showNurse();
      } else if (lastLine.speaker === 'patient') {
        const patient = level.newPatients[lastLine.patientIndex || 0];
        Sprites.showPatient(patient.gender, patient.name.split(' ')[0].toUpperCase());
      }
      document.getElementById('speech-text').textContent = lastLine.text;
      document.getElementById('speech-continue').style.visibility = 'hidden';
    }

    this.state.dialogueIndex = level.dialogue.length;
    this.state.phase = 'playing';
    document.getElementById('game-screen').classList.remove('dialogue-active');
  },

  renderRoster() {
    const grid = document.getElementById('room-grid');
    grid.innerHTML = '';

    const roomMap = {};
    Object.values(this.state.beds).forEach((bed) => {
      if (!roomMap[bed.room]) roomMap[bed.room] = [];
      roomMap[bed.room].push(bed);
    });

    Object.entries(roomMap).forEach(([roomNum, beds]) => {
      const roomEl = document.createElement('div');
      roomEl.className = 'room-group';
      const type = beds[0].type;
      const typeLabel = type === 'private' ? 'PRIVATE' : 'SEMI-PRIVATE';
      const typeClass = type === 'private' ? 'type-private' : 'type-semi';

      let html = `<div class="room-header">
        <span class="room-number">RM ${roomNum}</span>
        <span class="room-type-badge ${typeClass}">${typeLabel}</span>
      </div><div class="room-beds">`;

      beds.forEach((bed) => {
        if (bed.patient) {
          const gClass = bed.patient.gender === 'F' ? 'female' : 'male';
          const gSymbol = bed.patient.gender === 'F' ? '\u2640' : '\u2642';
          const isoClass = bed.patient.isolation ? ' isolation' : '';
          let condHtml = '';
          if (bed.patient.isolation) {
            condHtml = `<div class="bed-condition isolation-badge"><span class="warn-icon">!</span> ISO</div>`;
          } else if (bed.patient.condition) {
            condHtml = `<div class="bed-condition">${bed.patient.condition}</div>`;
          }
          html += `<div class="bed-slot occupied ${gClass}${isoClass}" draggable="true"
                        data-bed-id="${bed.id}" data-patient-id="${bed.patient.id}">
            <div class="bed-id">${bed.id}</div>
            <div class="bed-content">
              <div class="bed-sprite" data-gender="${bed.patient.gender}"></div>
              <div class="bed-info">
                <span class="bed-patient-name">${bed.patient.name.split(' ')[0]}</span>
                <span class="gender-badge ${gClass}">${gSymbol}</span>
              </div>
              ${condHtml}
            </div>
          </div>`;
        } else {
          html += `<div class="bed-slot empty" data-bed-id="${bed.id}">
            <div class="bed-id">${bed.id}</div>
            <div class="bed-content">
              <div class="bed-empty-icon"></div>
              <span class="bed-empty-text">Empty</span>
            </div>
          </div>`;
        }
      });

      html += '</div>';
      roomEl.innerHTML = html;
      grid.appendChild(roomEl);
    });

    grid.querySelectorAll('.bed-sprite').forEach((el) => {
      Sprites.renderMiniSprite(el, el.dataset.gender, 3);
    });
  },

  renderNewPatients() {
    const container = document.getElementById('new-patients');
    container.innerHTML = '';

    this.state.newPatients.forEach((patient) => {
      if (patient.placed) return;
      const card = document.createElement('div');
      card.className = 'patient-card' + (patient.isolation ? ' isolation' : '');
      card.draggable = true;
      card.dataset.patientId = patient.id;

      let conditionHtml = '';
      if (patient.isolation) {
        conditionHtml = `<div class="patient-condition isolation-badge">
          <span class="warn-icon">!</span> ${patient.condition} - ISOLATION
        </div>`;
      } else if (patient.condition) {
        conditionHtml = `<div class="patient-condition">${patient.condition}</div>`;
      }

      card.innerHTML = `
        <div class="card-sprite" data-gender="${patient.gender}"></div>
        <div class="card-info">
          <div class="card-name">${patient.name}</div>
          <div class="card-details">${patient.age} yr old &bull;
            <span class="${patient.gender === 'F' ? 'text-female' : 'text-male'}">
              ${patient.gender === 'F' ? 'Female' : 'Male'}
            </span>
          </div>
          ${conditionHtml}
        </div>
      `;

      container.appendChild(card);
      const spriteEl = card.querySelector('.card-sprite');
      Sprites.renderMiniSprite(spriteEl, patient.gender, 4);
    });
  },

  getPatientById(id) {
    const np = this.state.newPatients.find((p) => p.id === id);
    if (np) return np;
    for (const bed of Object.values(this.state.beds)) {
      if (bed.patient && bed.patient.id === id) return bed.patient;
    }
    return null;
  },

  findPatientBed(patientId) {
    for (const [bedId, bed] of Object.entries(this.state.beds)) {
      if (bed.patient && bed.patient.id === patientId) return bedId;
    }
    return null;
  },

  getRoommate(bedId) {
    const bed = this.state.beds[bedId];
    if (!bed || bed.type === 'private') return null;
    for (const other of Object.values(this.state.beds)) {
      if (other.id !== bedId && other.room === bed.room && other.patient) {
        return other.patient;
      }
    }
    return null;
  },

  validatePlacement(patient, targetBedId) {
    const targetBed = this.state.beds[targetBedId];
    if (!targetBed) return { valid: false, message: "Invalid bed." };

    if (targetBed.patient) {
      return { valid: false, message: "That bed is occupied! Move the patient out first." };
    }

    if (patient.isolation && targetBed.type !== 'private') {
      return {
        valid: false,
        message: `${patient.name || 'This patient'} has ${patient.condition} and needs ISOLATION in a private room!`,
      };
    }

    if (targetBed.type === 'semi-private') {
      const roommate = this.getRoommate(targetBedId);
      if (roommate && roommate.gender !== patient.gender) {
        const pg = patient.gender === 'F' ? 'Female' : 'Male';
        const rg = roommate.gender === 'F' ? 'female' : 'male';
        return {
          valid: false,
          message: `${pg} and ${rg} patients cannot share a semi-private room!`,
        };
      }
    }

    if (!patient.isolation && targetBed.type === 'private') {
      const hasUnplacedIsolation = this.state.newPatients.some(
        (p) => p.isolation && !p.placed && p.id !== patient.id
      );
      const isolationInPrivate = Object.values(this.state.beds).some(
        (b) => b.type === 'private' && b.patient && b.patient.isolation
      );
      if (hasUnplacedIsolation || !isolationInPrivate) {
        return {
          valid: false,
          message: `${patient.name || 'This patient'} doesn't need a private room. Save it for someone who needs isolation!`,
        };
      }
    }

    return { valid: true };
  },

  handleDrop(patientId, targetBedId, sourceType, sourceBedId) {
    const patient = this.getPatientById(patientId);
    if (!patient) return;

    const validation = this.validatePlacement(patient, targetBedId);
    const targetSlot = document.querySelector(`.bed-slot[data-bed-id="${targetBedId}"]`);

    if (!validation.valid) {
      if (targetSlot) {
        Animations.shake(targetSlot);
        Animations.flashRed(targetSlot);
      }
      this.showNotification(validation.message);
      return;
    }

    if (sourceType === 'bed' && sourceBedId) {
      this.state.beds[sourceBedId].patient = null;
    }

    if (sourceType === 'new') {
      const np = this.state.newPatients.find((p) => p.id === patientId);
      if (np) {
        np.placed = true;
        np.currentBed = targetBedId;
      }
    }

    this.state.beds[targetBedId].patient = { ...patient };

    this.renderRoster();
    this.renderNewPatients();

    if (targetSlot) {
      const newSlot = document.querySelector(`.bed-slot[data-bed-id="${targetBedId}"]`);
      if (newSlot) Animations.celebratePlacement(newSlot);
    }

    DragManager.disable();
    DragManager.enable();

    if (this.checkWinCondition()) {
      this.state.phase = 'complete';
      DragManager.disable();
      setTimeout(() => this.onLevelComplete(), 500);
    }
  },

  checkWinCondition() {
    const level = LEVELS[this.state.currentLevel];
    const solution = level.solution;

    for (const [bedId, expectedPatientId] of Object.entries(solution)) {
      const bed = this.state.beds[bedId];
      const actualId = bed.patient ? bed.patient.id : null;
      if (actualId !== expectedPatientId) return false;
    }
    return true;
  },

  onLevelComplete() {
    const level = LEVELS[this.state.currentLevel];

    Sprites.showNurse();
    Animations.spriteJump(document.getElementById('speaker-sprite'));
    Sprites.typeText(level.completionText, () => {});

    Animations.levelComplete(() => {
      const nextLevel = this.state.currentLevel + 1;
      if (nextLevel >= LEVELS.length) {
        this.showVictory();
      } else {
        this.loadLevel(nextLevel);
      }
    });
  },

  showVictory() {
    Animations.hideScreen('game-screen', () => {
      Animations.showScreen('victory-screen', () => {
        Animations.victoryScreen();
      });
    });
  },

  showNotification(message) {
    const notif = document.getElementById('notification');
    const textEl = document.getElementById('notification-text');
    const spriteEl = document.getElementById('notification-sprite');

    spriteEl.innerHTML = '';
    Sprites.renderMiniSprite(spriteEl, 'nurse', 3);
    textEl.textContent = message;

    notif.classList.remove('hidden');
    notif.classList.add('visible');
    gsap.fromTo(notif, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });

    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      gsap.to(notif, {
        opacity: 0, y: -10, duration: 0.3,
        onComplete: () => {
          notif.classList.remove('visible');
          notif.classList.add('hidden');
        },
      });
    }, 3000);
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());
