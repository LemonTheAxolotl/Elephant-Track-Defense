const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const GAME_PATH = path.join(__dirname, 'game.js');
const DIFFICULTY_PATH = path.join(__dirname, 'difficulty.js');
const ORB_PROGRESSION_PATH = path.join(__dirname, 'orb-progression.js');

class FakeElement {
  constructor(tagName = 'DIV', selector = '') {
    this.tagName = String(tagName || 'DIV').toUpperCase();
    this.selector = selector;
    this.value = '1';
    this.disabled = false;
    this.checked = false;
    this.hidden = false;
    this.width = 1120;
    this.height = 680;
    this.parentElement = null;
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.listeners = new Map();
    this.childSelectorMap = new Map();
    this._textContent = '';
    this._innerHTML = '';
    this._classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this._classes.add(name)),
      remove: (...names) => names.forEach(name => this._classes.delete(name)),
      toggle: (name, force) => {
        if (force === true) {
          this._classes.add(name);
          return true;
        }
        if (force === false) {
          this._classes.delete(name);
          return false;
        }
        if (this._classes.has(name)) {
          this._classes.delete(name);
          return false;
        }
        this._classes.add(name);
        return true;
      },
      contains: name => this._classes.has(name)
    };
  }

  get textContent() {
    if (this.children.length) return this.children.map(child => child.textContent).join('');
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value ?? '');
    this.children = [];
  }

  get lastChild() {
    if (!this.children.length) {
      const child = new FakeElement('SPAN');
      child.parentElement = this;
      this.children.push(child);
    }
    return this.children[this.children.length - 1];
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatchEvent(event = {}) {
    const type = event.type;
    if (!type) throw new Error('FakeElement.dispatchEvent requires an event type');
    const payload = {
      type,
      target: this,
      currentTarget: this,
      clientX: event.clientX,
      clientY: event.clientY,
      deltaY: event.deltaY,
      deltaX: event.deltaX,
      key: event.key,
      code: event.code,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      preventDefault() {},
      stopPropagation() {},
      ...event
    };
    for (const listener of this.listeners.get(type) || []) listener(payload);
    return true;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = [];
    for (const child of children) this.appendChild(child);
  }

  querySelector(selector) {
    if (!this.childSelectorMap.has(selector)) {
      const tag = selector.startsWith('#') ? 'DIV' : selector.split(/[\s.#[:]/)[0] || 'DIV';
      const element = new FakeElement(tag, selector);
      element.parentElement = this;
      this.childSelectorMap.set(selector, element);
    }
    return this.childSelectorMap.get(selector);
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  select() {}

  contains(target) {
    return target === this || this.children.includes(target);
  }

  closest() {
    return this;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }

  getContext() {
    const gradient = { addColorStop() {} };
    return new Proxy(
      {},
      {
        get(target, key) {
          if (key in target) return target[key];
          if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient;
          return () => {};
        },
        set(target, key, value) {
          target[key] = value;
          return true;
        }
      }
    );
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
    this.activeElement = null;
    this.body = this.querySelector('body');
  }

  querySelector(selector) {
    if (!this.elements.has(selector)) {
      const tag = selector === '#game' ? 'CANVAS' : selector.startsWith('#') ? 'DIV' : selector.split(/[\s.#[:]/)[0] || 'DIV';
      const element = new FakeElement(tag, selector);
      element.ownerDocument = this;
      const robotChoice = selector.match(/^\[data-robot-specialization="(standard|ghost|food|fume)"\]$/);
      if (robotChoice) element.dataset.robotSpecialization = robotChoice[1];
      if (selector === '#game') {
        element.width = 1120;
        element.height = 680;
      }
      this.elements.set(selector, element);
    }
    return this.elements.get(selector);
  }

  querySelectorAll(selector) {
    if (selector === '[data-robot-specialization]') {
      return ['standard', 'ghost', 'food', 'fume'].map(type => this.querySelector(`[data-robot-specialization="${type}"]`));
    }
    return [];
  }

  createElement(tagName) {
    const element = new FakeElement(tagName);
    element.ownerDocument = this;
    return element;
  }

  addEventListener() {}
}

class FakeWindow {
  constructor(document) {
    this.document = document;
    this.devicePixelRatio = 1;
    this.visualViewport = { addEventListener() {} };
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatchEvent(event = {}) {
    const type = event.type;
    const payload = {
      type,
      target: this,
      currentTarget: this,
      key: event.key,
      code: event.code,
      preventDefault() {},
      stopPropagation() {},
      ...event
    };
    for (const listener of this.listeners.get(type) || []) listener(payload);
    return true;
  }

  matchMedia() {
    return { matches: false, addEventListener() {}, removeEventListener() {} };
  }
}

function createVm(seed) {
  const document = new FakeDocument();
  const window = new FakeWindow(document);
  const storage = new Map();
  const context = vm.createContext({
    console,
    Math,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Map,
    Set,
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    __ELEPHANT_TEST_MODE__: true,
    setTimeout(callback) {
      if (typeof callback === 'function') callback();
      return 1;
    },
    clearTimeout() {},
    OrbProgression: require(ORB_PROGRESSION_PATH),
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      }
    },
    document,
    window
  });

  vm.runInContext(fs.readFileSync(GAME_PATH, 'utf8'), context);
  vm.runInContext(fs.readFileSync(DIFFICULTY_PATH, 'utf8'), context);
  const run = expression => vm.runInContext(expression, context);
  const difficulty=['easy','normal','hard'].includes(process.env.ETD_DIFFICULTY)?process.env.ETD_DIFFICULTY:'normal';
  run(`tutorialData=normalizeTutorialData({completed:true,contexts:{}}); saveTutorialData(); reset(); state.difficulty='${difficulty}'; state.difficultyLocked=true; state.tutorialActive=false; state.specialSeed=${seed >>> 0}; state.randomState=(state.specialSeed^0x9e3779b9)>>>0; state.specialWindows={}; state.fumeWindows={}; state.specialWarningsSeen={ghost:false,food:false,fume:false}; updateUI();`);
  return { context, document, window, run };
}

function towerTypeName(tower) {
  if (!tower) return 'Unknown';
  if (tower.kind === 'papaya') return 'Papaya Plant';
  if (tower.kind === 'goldenPapaya') return 'Watermelon Farm';
  const names = {
    base: 'Water Elephant',
    eyewear: 'Ghost Scout Elephant',
    foodie: 'Foodie Elephant',
    gas: 'Gas Mask Elephant',
    splash: 'Splash Elephant',
    frost: 'Frost Elephant',
    robot: 'Robot Factory'
  };
  return names[tower.towerType] || tower.name || 'Tower';
}

function clone(value) {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(value, (key, current) => {
      if (typeof current === 'object' && current !== null) {
        if (seen.has(current)) return '[Circular]';
        seen.add(current);
      }
      return current;
    })
  );
}

class NormalPlayerSimulation {
  constructor(seed, strategy = 'normal') {
    this.seed = seed >>> 0;
    this.strategy = strategy;
    const { document, window, run } = createVm(this.seed);
    this.document = document;
    this.window = window;
    this.run = run;
    this.canvas = document.querySelector('#game');
    this.report = [];
    this.flags = {
      starting: false,
      firstPurchase: false,
      starterGift: false,
      wave10: false,
      wave25: false,
      wave50: false,
      ghostEncounter: false,
      foodEncounter: false,
      fumeEncounter: false
    };
    this.lastWaveCheckpoint = 0;
    this.lastCheckpointHealth = this.health();
    this.roles = new Map();
    this.lastTowerCount = 0;
    this.engineerLosses = [];
    this.encounterResponses = { ghost: null, food: null, fume: null };
    this.lastDestroyed = 0;
    this.emergencySaleRecorded = false;
    this.staticPlacements = {
      water: [
        { x: 350, y: 370, label: 'upper center bend', reason: 'covers the first long corner and hits early waves repeatedly' },
        { x: 570, y: 620, label: 'middle exit bend', reason: 'covers the lower middle and the approach to the first visible exit lane' },
        { x: 860, y: 400, label: 'upper-right exit corner', reason: 'adds late-path cleanup close to the visible exit bend' },
        { x: 305, y: 815, label: 'lower-left corner', reason: 'extends coverage into the lower foundry once the map opens' },
        { x: 520, y: 1030, label: 'deep lower center bend', reason: 'covers the late lower switchback' }
      ],
      ghost: [
        { x: 860, y: 400, label: 'upper-right exit corner', reason: 'ghosts approaching the visible exit get a long final firing lane' },
        { x: 305, y: 815, label: 'lower-left ghost intercept', reason: 'adds a second ghost coverage zone deeper in the lower map' }
      ],
      foodie: [
        { x: 520, y: 1030, label: 'deep lower center bend', reason: 'food orbs entering the lower foundry stay in range longer' }
      ],
      gas: [
        { x: 610, y: 1120, label: 'late lower lane', reason: 'keeps at least one attacker operating during fume pressure near the lower endgame path' }
      ],
      papaya: [
        { x: 155, y: 410, label: 'upper-left foundry floor', reason: 'stays clear of the path while generating passive Metal' },
        { x: 960, y: 330, label: 'upper-right floor', reason: 'leaves firing corners open for elephants' },
        { x: 175, y: 850, label: 'lower-left floor', reason: 'uses safe build space for economy' },
        { x: 955, y: 860, label: 'lower-right floor', reason: 'keeps farms away from Engineer-prone firing positions' },
        { x: 205, y: 1180, label: 'deep lower-left floor', reason: 'adds late-game passive income' }
      ],
      watermelon: [
        { x: 945, y: 1120, label: 'deep lower-right floor', reason: 'increases wave income from a safe non-combat tile' }
      ],
      robot: [
        { x: 775, y: 620, label: 'mid-right factory floor', reason: 'keeps the factory away from the central attack cluster' },
        { x: 760, y: 1040, label: 'lower-right factory floor', reason: 'uses spare floor while its robots deploy at the exit' },
        { x: 260, y: 1050, label: 'lower-left factory floor', reason: 'spreads Engineer-hole risk' },
        { x: 860, y: 1280, label: 'deep lower-right factory floor', reason: 'leaves combat corners for direct-damage towers' },
        { x: 300, y: 1280, label: 'deep lower-left factory floor', reason: 'spreads the final factory footprint' }
      ],
      frost: [
        { x: 710, y: 730, label: 'middle choke', reason: 'slows dense groups before the lower path' },
        { x: 430, y: 1010, label: 'lower choke', reason: 'extends firing time during late waves' }
      ]
    };
  }

  element(selector) {
    return this.document.querySelector(selector);
  }

  click(selector) {
    this.element(selector).dispatchEvent({ type: 'click' });
  }

  setChecked(selector, checked) {
    const element = this.element(selector);
    element.checked = checked;
    element.dispatchEvent({ type: 'change' });
  }

  state() {
    return clone(this.run('state'));
  }

  wave() {
    return Number(this.run('state.wave'));
  }

  health() {
    return Number(this.run('state.currentHealth'));
  }

  currency() {
    return Number(this.run('state.currency'));
  }

  status() {
    return String(this.run('state.status'));
  }

  towers() {
    return clone(this.run('state.towers'));
  }

  units() {
    return clone(this.run('state.towers.concat(state.papayas,state.goldenPapayas)'));
  }

  balls() {
    return clone(this.run('state.balls'));
  }

  floorHoles() {
    return clone(this.run('state.engineerHoles||[]'));
  }

  visibleWarningText() {
    return this.element('#specialWarningText').textContent.trim();
  }

  warningVisible() {
    return !this.element('#specialWarning').classList.contains('hidden');
  }

  scrollTo(worldY) {
    const desired = Math.max(0, Math.min(worldY - 340, Number(this.run('maximumCameraY()'))));
    const current = Number(this.run('state.cameraY'));
    if (Math.abs(desired - current) < 1) return;
    this.canvas.dispatchEvent({ type: 'wheel', deltaY: desired - current, preventDefault() {} });
  }

  canvasClick(worldX, worldY) {
    this.scrollTo(worldY);
    const cameraY = Number(this.run('state.cameraY'));
    this.canvas.dispatchEvent({
      type: 'click',
      clientX: worldX,
      clientY: worldY - cameraY
    });
  }

  towerSummary() {
    return this.units().map(tower => `${towerTypeName(tower)} L${tower.level} @ (${Math.round(tower.x)}, ${Math.round(tower.y)})`).join('; ') || 'None';
  }

  record(message) {
    this.report.push(message);
  }

  locationLabel(position) {
    return `${position.label} (${position.x}, ${position.y})`;
  }

  findValidPosition(candidates) {
    for (const candidate of candidates) {
      const offsets = [
        [0, 0],
        [-24, 0], [24, 0], [0, -24], [0, 24],
        [-48, 0], [48, 0], [0, -48], [0, 48],
        [-24, -24], [24, -24], [-24, 24], [24, 24],
        [-72, 0], [72, 0], [0, -72], [0, 72]
      ];
      for (const [dx, dy] of offsets) {
        const x = candidate.x + dx;
        const y = candidate.y + dy;
        const valid = this.run(`placementAllowed({x:${x},y:${y}})`);
        if (valid) return { ...candidate, x, y };
      }
    }
    return null;
  }

  selectTowerAt(x, y) {
    this.canvasClick(x, y);
  }

  placeTower(kind, placement) {
    const buttons = {
      water: '#buyElephant',
      ghost: '#buyEyewear',
      foodie: '#buyFoodie',
      gas: '#buyGasMask',
      papaya: '#buyPapaya',
      watermelon: '#buyGoldenPapaya',
      robot: '#buyRobot',
      frost: '#buyFrost'
    };
    this.click(buttons[kind]);
    this.canvasClick(placement.x, placement.y);
    const selected = clone(this.run('state.selectedTower'));
    if (selected?.towerId) this.roles.set(`${kind}:${selected.towerId}`, { kind, placement });
    return selected;
  }

  continueWarning() {
    if (this.warningVisible()) this.click('#specialWarningContinue');
  }

  setAutoAndSpeed() {
    this.setChecked('#autoWaves', true);
    this.click('#gameSpeed');
    this.click('#gameSpeed');
  }

  upgradeTower(towerId, times = 1) {
    for (let index = 0; index < times; index++) {
      const tower = this.towers().find(item => item.towerId === towerId);
      if (!tower) return;
      this.selectTowerAt(tower.x, tower.y);
      this.click('#upgradeTower');
    }
  }

  buyInitialSetup() {
    if (!this.flags.starting) {
      this.record(`Starting currency and Health Points: ${this.currency()} Metal, ${this.health()} HP.`);
      this.flags.starting = true;
    }
    const first = this.findValidPosition(this.staticPlacements.water);
    const firstTower = this.placeTower('water', first);
    if (!this.flags.firstPurchase) {
      this.record(`First tower purchase: Water Elephant placed at ${this.locationLabel(first)} because ${first.reason}.`);
      this.flags.firstPurchase = true;
    }
    if (this.run('state.starterGift.giftPlacementPending')) {
      const second = this.findValidPosition(this.staticPlacements.water.slice(1));
      const giftTower = this.placeTower('water', second);
      if (!this.flags.starterGift) {
        this.record(`Starter gift tower received: free Water Elephant placed at ${this.locationLabel(second)}.`);
        this.flags.starterGift = true;
      }
      if (giftTower?.towerId) this.roles.set(`starter:${giftTower.towerId}`, { kind: 'water', placement: second });
    }
    this.setAutoAndSpeed();
  }

  towerCount(type) {
    return Number(this.run(`state.towers.filter(tower=>tower.towerType===${JSON.stringify(type)}&&!tower.sold).length`));
  }

  plantCount(kind) {
    return Number(this.run(`state.${kind === 'watermelon' ? 'goldenPapayas' : 'papayas'}.length`));
  }

  factoryStrategyBuild() {
    const wave = this.wave();
    const add = (kind, candidates, minimumMoney = 0) => {
      if (this.currency() < minimumMoney) return null;
      const spot = this.findValidPosition(candidates);
      return spot ? this.placeTower(kind, spot) : null;
    };

    // Follow the requested opening exactly: two Water Elephants (the second is the public starter gift), then plants.
    if (wave >= 3 && this.plantCount('papaya') < 1 && this.currency() >= 100) add('papaya', this.staticPlacements.papaya, 100);
    if (this.plantCount('papaya') >= 1 && this.plantCount('watermelon') < 1 && this.currency() >= 125) add('watermelon', this.staticPlacements.watermelon, 125);
    if (wave >= 13 && this.towerCount('eyewear') < 1 && this.currency() >= 125) add('ghost', this.staticPlacements.ghost, 125);
    if (wave >= 18 && this.towerCount('foodie') < 1 && this.currency() >= 150) add('foodie', this.staticPlacements.foodie, 150);
    if (wave >= 23 && this.towerCount('gas') < 1 && this.currency() >= 175) add('gas', this.staticPlacements.gas, 175);

    // Level the requested three early elephants once or twice before committing to the factory economy.
    if (this.plantCount('watermelon') >= 1 && this.towerCount('eyewear') >= 1) {
      const early = this.towers().filter(t => ['base', 'eyewear'].includes(t.towerType) && t.level < 2);
      for (const tower of early) {
        const cost = Number(this.run(`upgradeCost(state.towers.find(t=>t.towerId===${tower.towerId}))`));
        if (this.currency() >= cost + 25) this.upgradeTower(tower.towerId);
      }
    }

    // First factory is maxed before expansion. Its public level-five choice is Ghost specialization.
    if (wave >= 25 && this.towerCount('robot') < 1 && this.currency() >= 150) add('robot', this.staticPlacements.robot, 150);
    const robots = this.towers().filter(t => t.towerType === 'robot').sort((a, b) => a.towerId - b.towerId);
    const firstRobot = robots[0];
    if (firstRobot && firstRobot.level < 5) {
      const cost = Number(this.run(`upgradeCost(state.towers.find(t=>t.towerId===${firstRobot.towerId}))`));
      if (this.currency() >= cost + 75) this.upgradeTower(firstRobot.towerId);
    }
    const upgradedFirst = this.towers().find(t => t.towerId === firstRobot?.towerId);
    if (upgradedFirst?.level >= 5 && !upgradedFirst.robotSpecializationChosen) this.click('[data-robot-specialization="ghost"]');

    // After the first factory, add up to five public factories and give each eventual level-five factory a distinct role.
    if (robots.length >= 1 && robots[0].level >= 5 && robots.length < 5 && this.currency() >= 150) add('robot', this.staticPlacements.robot, 150);
    const specialization = ['ghost', 'food', 'fume', 'standard', 'standard'];
    for (const robot of this.towers().filter(t => t.towerType === 'robot').sort((a, b) => a.towerId - b.towerId)) {
      if (robot.level < 5 && this.currency() >= Number(this.run(`upgradeCost(state.towers.find(t=>t.towerId===${robot.towerId}))`)) + 120) this.upgradeTower(robot.towerId);
      const refreshed = this.towers().find(t => t.towerId === robot.towerId);
      const index = this.towers().filter(t => t.towerType === 'robot').sort((a, b) => a.towerId - b.towerId).findIndex(t => t.towerId === robot.towerId);
      if (refreshed?.level >= 5 && !refreshed.robotSpecializationChosen) this.click(`[data-robot-specialization="${specialization[index]}"]`);
    }

    // Economy and direct damage priority after the robot foundation, within normal unit caps.
    if (wave >= 30 && this.plantCount('papaya') < 5 && this.currency() >= 100) add('papaya', this.staticPlacements.papaya, 100);
    if (wave >= 30 && this.towerCount('base') < 9 && this.currency() >= 100) add('water', this.staticPlacements.water, 100);
    if (wave >= 32 && this.towerCount('frost') < 2 && this.currency() >= 125) add('frost', this.staticPlacements.frost, 125);
    if (wave >= 33 && this.towerCount('foodie') < 5 && this.currency() >= 150) add('foodie', this.staticPlacements.foodie, 150);
    if (wave >= 33 && this.towerCount('gas') < 2 && this.currency() >= 175) add('gas', this.staticPlacements.gas, 175);

    const priority = [
      ...this.towers().filter(t => t.towerType === 'base' && t.level < 5),
      ...this.towers().filter(t => t.kind === 'papaya' && t.level < 5),
      ...this.towers().filter(t => ['foodie', 'gas', 'eyewear', 'frost'].includes(t.towerType) && t.level < 2)
    ];
    for (const tower of priority) {
      const cost = Number(this.run(`upgradeCost(state.towers.find(t=>t.towerId===${tower.towerId}))`));
      if (this.currency() >= cost + 150) this.upgradeTower(tower.towerId);
    }

    // A normal-player emergency response: sell one non-gift Water Elephant only when health is critical,
    // then immediately use the refund for a final-lane Water Elephant if affordable.
    if (this.health() <= 25 && this.currency() < 100) {
      const sale = this.towers().find(t => t.towerType === 'base' && !t.starterGift);
      if (sale) {
        if (!this.emergencySaleRecorded) {
          this.record(`Emergency leak response: sold the paid Water Elephant at (${Math.round(sale.x)}, ${Math.round(sale.y)}) for its normal refund to fund a last-lane replacement if affordable.`);
          this.emergencySaleRecorded = true;
        }
        this.selectTowerAt(sale.x, sale.y);
        this.click('#sellTower');
        if (this.currency() >= 100) add('water', this.staticPlacements.water.slice(-1), 100);
      }
    }
  }

  maybeRespondToWarning() {
    if (!this.warningVisible()) return;
    const text = this.visibleWarningText();
    if (text.includes('Ghost Orbs incoming')) {
      if (!this.encounterResponses.ghost) {
        const spot = this.findValidPosition(this.staticPlacements.ghost);
        let response = 'continued with existing defense';
        if (spot && this.currency() >= 125) {
          const tower = this.placeTower('ghost', spot);
          response = `bought a Ghost Scout Elephant at ${this.locationLabel(spot)}`;
          if (tower?.towerId && this.currency() >= 100) this.upgradeTower(tower.towerId, 1);
        }
        this.encounterResponses.ghost = response;
        this.record(`First Ghost Orb encounter and response: warning before Wave ${this.wave() + 1}; ${response}.`);
        this.flags.ghostEncounter = true;
      }
    }
    if (text.includes('Food Orbs incoming')) {
      if (!this.encounterResponses.food) {
        const spot = this.findValidPosition(this.staticPlacements.foodie);
        let response = 'kept current towers';
        if (spot && this.currency() >= 150) {
          const tower = this.placeTower('foodie', spot);
          response = `bought a Foodie Elephant at ${this.locationLabel(spot)}`;
          if (tower?.towerId && this.currency() >= 125) this.upgradeTower(tower.towerId, 1);
        }
        this.encounterResponses.food = response;
        this.record(`First Food Orb encounter and response: warning before Wave ${this.wave() + 1}; ${response}.`);
        this.flags.foodEncounter = true;
      }
    }
    if (text.includes('Fume Orbs incoming')) {
      if (!this.encounterResponses.fume) {
        const spot = this.findValidPosition(this.staticPlacements.gas);
        let response = 'continued without a new immunity tower';
        if (spot && this.currency() >= 175) {
          const tower = this.placeTower('gas', spot);
          response = `bought a Gas Mask Elephant at ${this.locationLabel(spot)}`;
          if (tower?.towerId && this.currency() >= 175) this.upgradeTower(tower.towerId, 1);
        }
        this.encounterResponses.fume = response;
        this.record(`First Fume or Engineer Orb encounter and response: warning before Wave ${this.wave() + 1}; ${response}.`);
        this.flags.fumeEncounter = true;
      }
    }
    this.continueWarning();
  }

  maybeRepairHole() {
    const holes = this.floorHoles();
    if (!holes.length || this.currency() < 100) return;
    const hole = holes[0];
    this.click('#floorManage');
    this.canvasClick(hole.x, hole.y);
    if (this.floorHoles().length < holes.length) {
      this.record(`Floor management used: repaired an Engineer hole at (${Math.round(hole.x)}, ${Math.round(hole.y)}).`);
    }
  }

  maybeBuildAndUpgrade() {
    if (this.strategy === 'factory-economy') return this.factoryStrategyBuild();
    const wave = this.wave();
    const money = this.currency();
    const towers = this.towers();
    const byType = type => towers.filter(tower => tower.towerType === type);

    if (wave <= 10 && byType('base').length < 3 && money >= 100) {
      const spot = this.findValidPosition(this.staticPlacements.water.slice(byType('base').length));
      if (spot) this.placeTower('water', spot);
    }

    if (wave >= 14 && byType('eyewear').length < 2 && money >= 125) {
      const spot = this.findValidPosition(this.staticPlacements.ghost.slice(byType('eyewear').length));
      if (spot) this.placeTower('ghost', spot);
    }

    if (this.flags.foodEncounter && byType('foodie').length < 1 && money >= 150) {
      const spot = this.findValidPosition(this.staticPlacements.foodie);
      if (spot) this.placeTower('foodie', spot);
    }

    if (this.flags.fumeEncounter && byType('gas').length < 1 && money >= 175) {
      const spot = this.findValidPosition(this.staticPlacements.gas);
      if (spot) this.placeTower('gas', spot);
    }

    const updatedTowers = this.towers();
    const upgradePriority = [
      ...updatedTowers.filter(t => t.towerType === 'eyewear' && t.level < 3),
      ...updatedTowers.filter(t => t.towerType === 'base' && t.level < 2),
      ...updatedTowers.filter(t => t.towerType === 'foodie' && t.level < 2),
      ...updatedTowers.filter(t => t.towerType === 'gas' && t.level < 2)
    ];
    for (const tower of upgradePriority) {
      const cost = Number(this.run(`(()=>{const tower=state.towers.find(item=>item.towerId===${tower.towerId});return tower?upgradeCost(tower):Infinity})()`));
      if (this.currency() >= cost) this.upgradeTower(tower.towerId, 1);
    }
  }

  captureWaveCheckpoints() {
    const wave = this.wave();
    if (wave >= 10 && !this.flags.wave10) {
      this.record(`Reaching Wave 10: ${this.health()} HP, ${this.currency()} Metal, towers ${this.towerSummary()}.`);
      this.flags.wave10 = true;
    }
    if (wave >= 25 && !this.flags.wave25) {
      this.record(`Reaching Wave 25: ${this.health()} HP, ${this.currency()} Metal, towers ${this.towerSummary()}.`);
      this.flags.wave25 = true;
    }
    if (wave >= 50 && !this.flags.wave50) {
      this.record(`Reaching Wave 50: ${this.health()} HP, ${this.currency()} Metal, towers ${this.towerSummary()}.`);
      this.flags.wave50 = true;
    }
    const milestone = Math.floor(wave / 5) * 5;
    if (milestone >= 5 && milestone !== this.lastWaveCheckpoint && wave >= milestone) {
      const healthNow = this.health();
      const leak = this.lastCheckpointHealth - healthNow;
      this.record(`Wave ${milestone} checkpoint: ${healthNow} HP, ${this.currency()} Metal, towers ${this.towerSummary()}, notable leaks ${leak > 0 ? `${leak} HP lost since the previous checkpoint` : 'none'}.`);
      this.lastCheckpointHealth = healthNow;
      this.lastWaveCheckpoint = milestone;
    }
  }

  watchEncountersAndLosses() {
    const active = this.balls();
    if (!this.flags.ghostEncounter && active.some(orb => orb.ghost)) {
      this.flags.ghostEncounter = true;
      const response = this.encounterResponses.ghost || 'used the current defense without a new purchase';
      this.record(`First Ghost Orb encounter and response: observed during Wave ${this.wave()}; ${response}.`);
    }
    if (!this.flags.foodEncounter && active.some(orb => orb.specialType === 'food')) {
      this.flags.foodEncounter = true;
      const response = this.encounterResponses.food || 'used the current defense without a new purchase';
      this.record(`First Food Orb encounter and response: observed during Wave ${this.wave()}; ${response}.`);
    }
    if (!this.flags.fumeEncounter && active.some(orb => orb.specialType === 'fume' || orb.specialType === 'engineer')) {
      this.flags.fumeEncounter = true;
      const response = this.encounterResponses.fume || 'used the current defense without a new purchase';
      this.record(`First Fume or Engineer Orb encounter and response: observed during Wave ${this.wave()}; ${response}.`);
    }

    const towers = this.towers();
    if (towers.length < this.lastTowerCount) {
      const currentIds = new Set(towers.map(tower => tower.towerId));
      const previous = this.previousTowers || [];
      for (const tower of previous) {
        if (!currentIds.has(tower.towerId)) {
          const lostToEngineer = (this.floorHoles().length > 0) || (tower.behavior === 'falling');
          if (lostToEngineer) {
            const message = `${towerTypeName(tower)} at (${Math.round(tower.x)}, ${Math.round(tower.y)}) disappeared after Engineer pressure.`;
            if (!this.engineerLosses.includes(message)) {
              this.engineerLosses.push(message);
              this.record(`Any tower lost to an Engineer hole: ${message}`);
            }
          }
        }
      }
    }
    this.previousTowers = towers;
    this.lastTowerCount = towers.length;
  }

  tick(dt) {
    this.run(`update(${dt})`);
  }

  play() {
    this.buyInitialSetup();
    this.previousTowers = this.towers();
    this.lastTowerCount = this.previousTowers.length;

    const maxTicks = 120000;
    for (let tick = 0; tick < maxTicks; tick++) {
      if (this.status() !== 'playing') break;
      this.maybeRespondToWarning();
      this.maybeRepairHole();
      this.maybeBuildAndUpgrade();
      this.captureWaveCheckpoints();
      this.watchEncountersAndLosses();
      this.tick(0.1);
      if (this.status() !== 'playing') break;
      if (this.warningVisible()) continue;
    }

    this.captureWaveCheckpoints();
    this.watchEncountersAndLosses();
    return this.buildFinalReport();
  }

  buildFinalReport() {
    const state = this.state();
    const defeated = Number(state.stats?.destroyed || 0);
    const escaped = Number(state.stats?.escaped || 0);
    const lost = this.status() === 'lost';
    const won = this.status() === 'won';
    const lines = [
      '# Normal Player Simulation',
      '',
      `Seed: ${this.seed}`,
      '',
      ...this.report.map(item => `- ${item}`)
    ];

    if (!this.flags.foodEncounter) lines.push('- First Food Orb encounter and response: not reached in this run.');
    if (!this.flags.fumeEncounter) lines.push('- First Fume or Engineer Orb encounter and response: not reached in this run.');
    if (!this.flags.wave25) lines.push('- Reaching Wave 25: not reached in this run.');
    if (!this.flags.wave50) lines.push('- Reaching Wave 50: not reached in this run.');
    if (!won) lines.push('- Final boss encounter, if reached: not reached in this run.');

    if (lost) {
      lines.push(
        `- Final victory or defeat result: Defeat on Wave ${this.wave()}.`,
        `- Wave lost: ${this.wave()}.`,
        `- Total orbs defeated: ${defeated}.`,
        `- Metal currency at defeat: ${this.currency()}.`,
        `- Towers and upgrades owned: ${this.towerSummary()}.`,
        `- Main reason for failure: ${this.strategy === 'factory-economy' ? 'the requested factory-and-economy build could not turn its expensive late setup into enough immediate damage before accumulated leaks exhausted Health.' : 'ghost pressure arrived before the broader defense scaled, leaving too little Health to absorb later leaks.'}`,
        `- Specific balance recommendations, without automatically changing the game: ${this.strategy === 'factory-economy' ? 'consider smoothing the transition into the factory economy, increasing affordable anti-special damage before Wave 30, or reducing the amount of income that must be reinvested before a Level-5 Robot Factory meaningfully protects the path.' : 'early ghost pressure may need a softer ramp, cheaper first Ghost Scout upgrade, or clearer earlier warning; this single run also suggests that new players who stay mostly on Water Elephants can fall behind quickly once special orbs begin overlapping.'}`
      );
    } else if (won) {
      lines.push(
        `- Final boss encounter, if reached: reached and cleared.`,
        `- Final victory or defeat result: Victory.`,
        `- Final Health Points: ${this.health()}.`,
        `- Final Metal currency: ${this.currency()}.`,
        `- Towers and upgrades owned: ${this.towerSummary()}.`,
        `- Total orbs defeated: ${defeated}.`,
        `- Important decisions that led to victory: early double-Water opening, reacting to ghost warnings with Ghost Scouts, and adding specialty counters only after they were publicly introduced.`,
        `- Balance review explaining: this single run only. Too easy: none observed. Too difficult: any sharp special-wave transition that outpaces affordable counterplay. Balanced or just right: the opening Water Elephant plus starter-gift onboarding. Possible adjustments: early ghost/fume overlap, specialty-tower pricing, and how punishing Engineer-created holes are for first-time players.`
      );
    } else {
      lines.push(`- Final victory or defeat result: Simulation ended unexpectedly after Wave ${this.wave()}.`);
    }

    lines.push('', 'Would you like me to simulate another run with a different legal strategy?');
    return lines.join('\n');
  }
}

if (require.main === module) {
  const strategyArgument = process.argv.find(argument => argument.startsWith('--strategy='));
  const strategy = strategyArgument ? strategyArgument.split('=')[1] : 'normal';
  const seedArgument = Number(process.argv.find(argument => /^\d+$/.test(argument)));
  const seed = Number.isFinite(seedArgument) ? seedArgument >>> 0 : 20260728;
  const simulation = new NormalPlayerSimulation(seed, strategy);
  process.stdout.write(`${simulation.play()}\n`);
}

module.exports = { NormalPlayerSimulation };
