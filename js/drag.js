const DragManager = {
  enabled: false,
  _bound: false,
  draggedEl: null,
  draggedPatientId: null,
  sourceType: null,
  sourceBedId: null,
  _selectedEl: null,
  _selectedPatientId: null,
  _selectedSourceType: null,
  _selectedSourceBedId: null,

  enable() {
    this.enabled = true;
    if (!this._bound) this._bindEvents();
    // #region agent log
    fetch('http://127.0.0.1:7329/ingest/b76c846e-f8cc-447c-bbf0-bb4b07eb3c7a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1bfdd'},body:JSON.stringify({sessionId:'c1bfdd',location:'drag.js:enable',message:'DragManager.enable() called',data:{enabled:this.enabled},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
    // #endregion
  },

  disable() {
    this.enabled = false;
    this._deselectTap();
    this._clearHighlights();
  },

  _bindEvents() {
    this._bound = true;
    const gameArea = document.getElementById('game-area');

    gameArea.addEventListener('dragstart', (e) => {
      // #region agent log
      fetch('http://127.0.0.1:7329/ingest/b76c846e-f8cc-447c-bbf0-bb4b07eb3c7a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1bfdd'},body:JSON.stringify({sessionId:'c1bfdd',location:'drag.js:dragstart',message:'dragstart fired',data:{enabled:this.enabled,targetTag:e.target.tagName,targetClass:e.target.className,closestDraggable:!!e.target.closest('[draggable="true"]')},timestamp:Date.now(),hypothesisId:'H-C'})}).catch(()=>{});
      // #endregion
      if (!this.enabled) return;
      const card = e.target.closest('[draggable="true"]');
      if (!card) return;

      this.draggedEl = card;
      this.draggedPatientId = card.dataset.patientId;

      if (card.classList.contains('patient-card')) {
        this.sourceType = 'new';
        this.sourceBedId = null;
      } else if (card.classList.contains('bed-slot')) {
        this.sourceType = 'bed';
        this.sourceBedId = card.dataset.bedId;
      }

      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.draggedPatientId);

      requestAnimationFrame(() => this._highlightTargets());
    });

    gameArea.addEventListener('dragend', (e) => {
      if (this.draggedEl) {
        this.draggedEl.classList.remove('dragging');
      }
      this._clearHighlights();
      this.draggedEl = null;
      this.draggedPatientId = null;
      this.sourceType = null;
      this.sourceBedId = null;
    });

    gameArea.addEventListener('dragover', (e) => {
      if (!this.enabled) return;
      let slot = e.target.closest('.bed-slot.drop-target');
      if (!slot) {
        slot = this._findNearestDropTarget(e.clientX, e.clientY, 30);
      }
      if (slot) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.bed-slot.drag-over').forEach((s) => {
          if (s !== slot) s.classList.remove('drag-over');
        });
        slot.classList.add('drag-over');
      }
    });

    gameArea.addEventListener('dragleave', (e) => {
      if (e.target === gameArea) {
        document.querySelectorAll('.bed-slot.drag-over').forEach((s) => {
          s.classList.remove('drag-over');
        });
      }
    });

    gameArea.addEventListener('drop', (e) => {
      e.preventDefault();
      let slot = e.target.closest('.bed-slot.drop-target');
      if (!slot) {
        slot = this._findNearestDropTarget(e.clientX, e.clientY, 30);
      }
      if (!slot) return;
      slot.classList.remove('drag-over');

      const targetBedId = slot.dataset.bedId;
      const patientId = this.draggedPatientId;

      if (patientId && targetBedId) {
        Game.handleDrop(patientId, targetBedId, this.sourceType, this.sourceBedId);
      }

      this._clearHighlights();
    });

    this._bindTapEvents();
  },

  _bindTapEvents() {
    const gameArea = document.getElementById('game-area');

    gameArea.addEventListener('click', (e) => {
      if (!this.enabled) return;

      const card = e.target.closest('.patient-card[draggable="true"]');
      const occupiedBed = e.target.closest('.bed-slot.occupied[draggable="true"]');
      const emptyBed = e.target.closest('.bed-slot.empty, .bed-slot.drop-target');

      if (card) {
        const pid = card.dataset.patientId;
        if (this._selectedPatientId === pid) {
          this._deselectTap();
          return;
        }
        this._deselectTap();
        this._selectedEl = card;
        this._selectedPatientId = pid;
        this._selectedSourceType = 'new';
        this._selectedSourceBedId = null;
        card.classList.add('selected');
        this._highlightTargetsForTap();
        return;
      }

      if (occupiedBed && !emptyBed) {
        const pid = occupiedBed.dataset.patientId;
        if (this._selectedPatientId === pid) {
          this._deselectTap();
          return;
        }
        this._deselectTap();
        this._selectedEl = occupiedBed;
        this._selectedPatientId = pid;
        this._selectedSourceType = 'bed';
        this._selectedSourceBedId = occupiedBed.dataset.bedId;
        occupiedBed.classList.add('selected');
        this._highlightTargetsForTap();
        return;
      }

      if (emptyBed && this._selectedPatientId) {
        const targetBedId = emptyBed.dataset.bedId;
        if (targetBedId) {
          Game.handleDrop(
            this._selectedPatientId,
            targetBedId,
            this._selectedSourceType,
            this._selectedSourceBedId
          );
        }
        this._deselectTap();
        return;
      }

      this._deselectTap();
    });
  },

  _highlightTargetsForTap() {
    if (!this._selectedPatientId) return;
    const patient = Game.getPatientById(this._selectedPatientId);
    if (!patient) return;
    document.querySelectorAll('.bed-slot.empty').forEach((slot) => {
      const bedId = slot.dataset.bedId;
      const validation = Game.validatePlacement(patient, bedId);
      if (validation.valid) {
        slot.classList.add('drop-target', 'valid-target');
      } else {
        slot.classList.add('drop-target', 'invalid-target');
      }
    });
  },

  _deselectTap() {
    if (this._selectedEl) {
      this._selectedEl.classList.remove('selected');
    }
    this._selectedEl = null;
    this._selectedPatientId = null;
    this._selectedSourceType = null;
    this._selectedSourceBedId = null;
    this._clearHighlights();
  },

  _highlightTargets() {
    if (!this.draggedPatientId) return;
    const patient = Game.getPatientById(this.draggedPatientId);
    if (!patient) return;

    document.querySelectorAll('.bed-slot.empty').forEach((slot) => {
      const bedId = slot.dataset.bedId;
      const validation = Game.validatePlacement(patient, bedId);
      if (validation.valid) {
        slot.classList.add('drop-target', 'valid-target');
      } else {
        slot.classList.add('drop-target', 'invalid-target');
      }
    });
  },

  _findNearestDropTarget(x, y, threshold) {
    let nearest = null;
    let minDist = threshold;
    document.querySelectorAll('.bed-slot.drop-target').forEach((slot) => {
      const rect = slot.getBoundingClientRect();
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = slot;
      }
    });
    return nearest;
  },

  _clearHighlights() {
    document.querySelectorAll('.bed-slot').forEach((slot) => {
      slot.classList.remove('drop-target', 'valid-target', 'invalid-target', 'drag-over');
    });
  },
};
