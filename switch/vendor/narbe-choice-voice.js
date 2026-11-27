/* Vendored NARBE shared modules, unmodified source bodies.
Upstream commit: 5b5686d43e7cebd66632d1a3d860f37dd4b9ae2d
Copyright (c) 2026 NARBE LLC

This software and associated documentation files (the "Software") are licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this Software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the terms of the MIT License.

The above copyright notice and permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Use of the names "NARBE," "NARBE Foundation," "Benny’s Accessibility Hub," or "SwitchedGames" (also presented as "Switched Games" and "SwitchedGames.org"), and any related branding, logos, or marks, does not grant trademark rights. Derivative works must not imply endorsement or official affiliation without written permission.

For partnership or branding inquiries, please visit:
https://narbehouse.com

*/

/* upstream: platform.js */
/**
 * Web platform boundary. Shared managers depend on this contract, never on
 * localStorage, iframe transport, native speech, or browser key capture.
 */
window.NarbePlatform = (function () {
  'use strict';

  function peers() {
    const result = Array.from(document.querySelectorAll('iframe'), frame => frame.contentWindow).filter(Boolean);
    if (window.parent && window.parent !== window) result.push(window.parent);
    return result;
  }
  function post(peer, data) {
    try { peer.postMessage(data, window.location.origin); } catch (_) { /* closed/cross-origin frame */ }
  }
  function openSettings({ key, normalize, project = value => value, onChange }) {
    let state, disposed = false;
    function read() {
      try { return normalize(JSON.parse(window.localStorage.getItem(key) || '{}')); }
      catch (_) { return state ? { ...state } : normalize({}); }
    }
    state = read();
    function notify() { onChange?.({ ...state }); }
    function broadcast(except) {
      for (const peer of peers()) {
        if (peer !== except) post(peer, { type: key + '-changed', settings: project(state) });
      }
    }
    function commit(value, source, persist = true) {
      if (disposed) return;
      const next = normalize(value);
      if (JSON.stringify(next) === JSON.stringify(state)) return;
      state = next;
      if (persist) {
        try { window.localStorage.setItem(key, JSON.stringify(state)); } catch (_) { /* memory still works */ }
      }
      notify();
      broadcast(source);
    }
    function reload() { commit(read(), null, false); return { ...state }; }
    const storage = event => { if (event.key === key || event.key === null) reload(); };
    window.addEventListener('storage', storage);
    window.addEventListener('focus', reload);
    const visible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', visible);
    const message = event => {
      if (event.origin !== window.location.origin || !peers().includes(event.source)) return;
      if (event.data?.type === key + '-request') {
        post(event.source, { type: key + '-changed', settings: project(state) });
      } else if (event.data?.type === key + '-changed' && event.data.settings &&
                 typeof event.data.settings === 'object') {
        // Older pages send only their known fields. Preserve newer settings.
        commit({ ...state, ...event.data.settings }, event.source);
      }
    };
    window.addEventListener('message', message);
    if (window.parent && window.parent !== window) {
      post(window.parent, { type: key + '-request' });
    }
    return {
      readCached: () => ({ ...state }),
      save: value => { commit(value); return { ...state }; },
      reload,
      ready: Promise.resolve(),
      dispose() {
        disposed = true;
        window.removeEventListener('storage', storage);
        window.removeEventListener('focus', reload);
        document.removeEventListener('visibilitychange', visible);
        window.removeEventListener('message', message);
      }
    };
  }

  function capture(handler) {
    const listener = event => {
      if (event.target?.closest?.('[data-scan-exclude], [data-settings-dialog]')) return;
      if (document.querySelector('.iframe-container')?.classList.contains('active')) return;
      handler(event);
    };
    window.addEventListener('keydown', listener, true);
    window.addEventListener('keyup', listener, true);
    return () => {
      window.removeEventListener('keydown', listener, true);
      window.removeEventListener('keyup', listener, true);
    };
  }

  function onActivity(callback) {
    const blur = () => callback(false);
    const focus = () => callback(document.visibilityState !== 'hidden');
    const visibility = () => callback(document.visibilityState !== 'hidden');
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }

  function onClose(callback) {
    const close = event => { if (!event.persisted) callback(); };
    window.addEventListener('pagehide', close);
    return () => window.removeEventListener('pagehide', close);
  }

  let currentSpeech = null;
  function cancelSpeech() {
    currentSpeech?.cancel();
    try { window.speechSynthesis?.cancel(); } catch (_) { /* unavailable engine */ }
  }
  function speak(text, options) {
    cancelSpeech();
    let resolveStart, resolveFinish, done = false, didStart = false;
    let deferred, startDeadline, utterance;
    const started = new Promise(resolve => { resolveStart = resolve; });
    const finished = new Promise(resolve => { resolveFinish = resolve; });
    function markStarted() {
      if (done) return;
      didStart = true;
      clearTimeout(startDeadline);
      resolveStart(true);
    }
    function finish(reason) {
      if (done) return;
      done = true;
      clearTimeout(deferred);
      clearTimeout(startDeadline);
      resolveStart(didStart);
      resolveFinish({ reason, started: didStart });
      if (currentSpeech === ticket) currentSpeech = null;
    }
    const ticket = {
      started, finished,
      cancel() {
        if (done) return;
        finish('cancelled');
        try { window.speechSynthesis?.cancel(); } catch (_) { /* unavailable engine */ }
      }
    };
    currentSpeech = ticket;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      finish('unavailable');
      return ticket;
    }
    // Keep the existing Chrome/Edge cancel-to-speak gap.
    deferred = setTimeout(() => {
      if (done) return;
      try {
        utterance = new window.SpeechSynthesisUtterance(String(text));
        Object.assign(utterance, options);
        utterance.onstart = markStarted;
        utterance.onend = () => { markStarted(); finish('end'); };
        utterance.onerror = () => finish('error');
        window.speechSynthesis.speak(utterance);
        startDeadline = setTimeout(() => {
          if (done || didStart) return;
          if (window.speechSynthesis.speaking) markStarted();
          else {
            finish('failed-to-start');
            try { window.speechSynthesis.cancel(); } catch (_) { /* unavailable engine */ }
          }
        }, 950); // Including the 50 ms gap, resolve failed startup within the fastest scan interval.
      } catch (_) { finish('error'); }
    }, 50);
    return ticket;
  }

  return {
    settings: { open: openSettings },
    input: { capture },
    lifecycle: { onActivity, onClose },
    speech: {
      getVoices() {
        try { return window.speechSynthesis?.getVoices() || []; } catch (_) { return []; }
      },
      onVoicesChanged(callback) {
        window.speechSynthesis?.addEventListener('voiceschanged', callback);
        return () => window.speechSynthesis?.removeEventListener('voiceschanged', callback);
      },
      speak, cancel: cancelSpeech
    }
  };
})();

;

/* upstream: scan-status-badge.js */
/**
 * Shared scan feedback. Parked has a status badge outside the choices.
 * Scan pause uses only a dotted outline on the selected choice.
 */
window.NarbeScanStatusBadge = (function () {
  'use strict';
  function create({ host } = {}) {
    if (!host) throw new Error('Reserve a statusHost outside the choice items');
    const node = document.createElement('span');
    node.className = 'narbe-scan-status-badge';
    node.hidden = true;
    node.setAttribute('data-scan-exclude', '');
    host.classList.add('narbe-scan-status-host');
    host.appendChild(node);
    let markedItem = null, previous = '', wasSuspended = false;
    function clearMarker() {
      markedItem?.removeAttribute('data-narbe-scan-paused');
      markedItem = null;
    }
    return {
      update(value, context = {}) {
        const next = value === 'Parked' || value === 'Paused' ? value : '';
        clearMarker();
        if (next === 'Paused' && context.item?.nodeType === 1) {
          markedItem = context.item;
          markedItem.setAttribute('data-narbe-scan-paused', '');
        }
        node.textContent = next === 'Parked' ? next : '';
        node.hidden = next !== 'Parked';
        const suspended = !!context.state?.suspended;
        // Actual parking clears every choice. Bring its existing status into
        // view once; do not scroll on ordinary -1 steps or create a new panel.
        if (next === 'Parked' && !suspended && (previous !== 'Parked' || wasSuspended)) {
          host.scrollIntoView?.({block: 'nearest', inline: 'nearest'});
        }
        previous = next;
        wasSuspended = suspended;
      },
      destroy() { clearMarker(); node.remove(); }
    };
  }
  return { create };
})();

;

/* upstream: choice-scan.js */
/**
 * Opt-in controller for stationary CHOICE scans only.
 * Apps forward input AFTER the existing guard, retain native selection/pause
 * ownership, and provide their existing Space hold threshold. No key listeners
 * or second debounce live here. Settings always come from NarbeScanManager.
 */
window.NarbeChoiceScan = (function () {
  'use strict';
  function create(manager, options) {
    if (options?.choice !== true) throw new Error('Choice scans require an explicit stationary-choice context');
    if (!Number.isFinite(options.holdThreshold) || options.holdThreshold <= 0) {
      throw new Error('Pass this surface\'s existing Space hold threshold');
    }
    const identify = options.getId || (item => item.id);
    const label = options.getLabel || (item => item.label);
    const speak = options.speak || (text => window.NarbeVoiceManager?.speak(text));
    const badge = options.badge || window.NarbeScanStatusBadge.create({ host: options.statusHost });
    let items = [], parents = [], index = -1, parked = false, braked = false;
    let held = null, loops = 0, fullLoop = false, loopDirection = 1, disposed = false;
    let suspended = false, inactive = false, inputHeld = false, timer = null, generation = 0;
    let due = Infinity, waiting = false, ownSpeech = null, inputSpeech = null;
    let pauseGeneration = 0, pauseSpeech = null, parkingSpeech = null;
    let prefs = manager.getSettings();
    function validate(next) {
      const ids = next.map(identify);
      if (ids.some(id => id === null || id === undefined) || new Set(ids).size !== ids.length) {
        throw new Error('Choice scan items require unique stable identities');
      }
      return [...next];
    }
    function state() {
      return {
        index, id: index < 0 ? null : identify(items[index]), depth: parents.length,
        parked, braked, held: !!held, inputHeld, loops, waitingForSpeech: waiting,
        suspended: suspended || inactive, disposed
      };
    }
    function draw() {
      const item = index < 0 ? null : items[index], current = state();
      badge.update(parked ? 'Parked' : (braked || held?.braking) ? 'Paused' : '', {
        item: item === null ? null : options.getElement ? options.getElement(item) : item,
        label: item === null ? null : options.getLabelElement?.(item) || null,
        state: current
      });
      options.onHighlight?.(item, current);
    }
    function stopClock() {
      clearTimeout(timer);
      timer = null;
      generation++;
      waiting = false;
      due = Infinity;
    }
    function eligible() {
      return !disposed && !suspended && !inactive && prefs.autoScan &&
        !parked && !braked && !held?.braking && !held?.waitForRelease && !inputHeld && items.length > 0;
    }
    function readyToAdvance() { return eligible() && !waiting && Date.now() >= due; }
    function arm(delay) {
      due = Date.now() + Math.max(0, delay);
      timer = setTimeout(() => {
        timer = null;
        if (readyToAdvance()) step(1);
      }, Math.max(0, delay));
    }
    function schedule(ticket, began = Date.now()) {
      stopClock();
      if (!eligible()) return;
      const token = generation;
      if (!prefs.waitForSpeech || !ticket?.finished) { arm(prefs.scanInterval); return; }
      waiting = true;
      // NarbeVoiceManager owns the bounded completion contract.
      Promise.resolve(ticket.finished).then(result => {
        if (token !== generation || !eligible()) return;
        waiting = false;
        // Disabled/failed speech behaves like ordinary interval scanning.
        arm(result?.started ? prefs.scanInterval : Math.max(0, prefs.scanInterval - (Date.now() - began)));
      }, () => {
        if (token !== generation || !eligible()) return;
        waiting = false;
        arm(Math.max(0, prefs.scanInterval - (Date.now() - began)));
      });
    }
    function clearPauseAnnouncement() {
      pauseGeneration++;
      pauseSpeech?.cancel?.();
      pauseSpeech = null;
    }
    function queuePauseAnnouncement() {
      clearPauseAnnouncement();
      const token = pauseGeneration, ticket = ownSpeech;
      if (!ticket?.finished) return;
      Promise.resolve(ticket.finished).then(result => {
        if (token !== pauseGeneration || disposed || suspended || inactive ||
            !prefs.autoScan || !braked || parked || ownSpeech !== ticket) return;
        // A timeout releases the clock but may leave native speech running.
        // Only a confirmed normal end permits this follow-up announcement.
        if (result?.reason !== 'end' || !result.started) return;
        parkingSpeech = null;
        pauseSpeech = ownSpeech = speak('Paused');
      }, () => {});
    }
    function announce(text, parkingLabel = false) {
      clearPauseAnnouncement();
      ownSpeech = speak(text);
      parkingSpeech = parkingLabel ? ownSpeech : null;
      return ownSpeech;
    }
    function currentLabel() {
      // The recurring blank is silent in Step and while Parking is Off.
      if (index < 0) return prefs.autoScan && prefs.parking !== 'off' ? (parked ? 'parked' : 'park') : null;
      return label(items[index]);
    }
    function announceCurrent(text, { parkingLabel = false } = {}) {
      if (disposed) return;
      clearPauseAnnouncement();
      const began = Date.now();
      const current = text === undefined ? currentLabel() : text;
      const ticket = current === null ? null : announce(current, parkingLabel || (text === undefined && index < 0));
      schedule(ticket, began);
      return ticket;
    }
    function land(next, announceLabel = true) {
      clearPauseAnnouncement();
      stopClock();
      index = next;
      draw();
      if (disposed) return;
      const began = Date.now();
      const current = currentLabel();
      // A silent blank also ends its owned label; unrelated narration has
      // its own ticket and must remain untouched.
      if (current === null) { ownSpeech?.cancel?.(); ownSpeech = null; parkingSpeech = null; }
      const ticket = announceLabel && current !== null ? announce(current, index < 0) : null;
      schedule(ticket, began);
    }
    function park() {
      if (disposed || !manager.isParkingEnabled()) return false;
      stopClock();
      while (parents.length) items = parents.pop().items;
      index = -1;
      parked = true;
      braked = false;
      held = null;
      draw();
      announce('parked', true);
      return true;
    }
    function resume() {
      if (disposed || !parked) return false;
      parked = false;
      loops = 0;
      fullLoop = true;
      loopDirection = 1;
      land(items.length ? 0 : -1);
      return true;
    }
    function rootBoundary() {
      // Non-wrapping child groups finish at root -1, where parking belongs.
      while (parents.length) items = parents.pop().items;
      index = -1;
      if (fullLoop) loops++;
      fullLoop = false;
      if (manager.shouldParkAfterLoop(loops)) return park();
      land(-1);
      return true;
    }
    function step(direction = 1) {
      if (disposed || suspended || inactive || parked || braked || held?.braking) return false;
      if (!items.length) { land(-1); return false; }
      const forward = direction >= 0;
      const nextDirection = forward ? 1 : -1;
      if (nextDirection !== loopDirection) fullLoop = false;
      loopDirection = nextDirection;
      if (parents.length && ((forward && index === items.length - 1) || (!forward && index === 0))) {
        if (parents[parents.length - 1].wrap) {
          // Keyboard rows keep scanning their keys until selection or Back.
          // Their local cycles are not completed root loops for parking.
          land(forward ? 0 : items.length - 1);
          return true;
        }
        return rootBoundary();
      }
      const next = forward ? (index === items.length - 1 ? -1 : index + 1) :
        (index === -1 ? items.length - 1 : index - 1);
      if (next === -1) return rootBoundary();
      if ((forward && next === 0) || (!forward && next === items.length - 1)) fullLoop = true;
      land(next);
      return true;
    }
    function select() {
      if (disposed || suspended || inactive) return false;
      if (parked) { resume(); return true; }
      if (index < 0) {
        if (prefs.autoScan && prefs.parking === 'chosen') return park();
        return false;
      }
      options.onSelect?.(items[index], state());
      return true;
    }
    function brakePress() {
      if (held) return true; // native key repeats do not restart the hold
      if (disposed || suspended || inactive || !prefs.autoScan || !prefs.spaceBrake ||
          options.brakeKeyAvailable === false) return false;
      held = { at: Date.now(), wasBraked: braked, braking: (index >= 0 || braked) && !parked };
      if (held.braking) {
        stopClock();
        braked = true;
        draw(); // keep the item and its speech
        if (!held?.wasBraked && braked) queuePauseAnnouncement();
      }
      return true; // -1 / parked: consume Space without changing state
    }
    function brakeRelease() {
      if (!held) return false;
      const press = held;
      held = null;
      if (!press.braking) {
        if (press.waitForRelease) { draw(); schedule(null); }
        return true;
      }
      if (!prefs.autoScan || !prefs.spaceBrake || press.wasBraked ||
          Date.now() - press.at >= options.holdThreshold) {
        clearPauseAnnouncement();
        braked = false;
        draw();
        schedule(null); // always one FULL interval, even if old speech continues
      } else {
        braked = true;
        draw();
      }
      return true;
    }
    function replaceItems(next) {
      if (disposed) return;
      const remembered = index < 0 ? null : identify(items[index]);
      items = validate(next);
      index = remembered === null ? -1 : items.findIndex(item => identify(item) === remembered);
      const removed = remembered !== null && index < 0;
      if (removed) while (parents.length) items = parents.pop().items;
      draw();
      if (removed) {
        clearPauseAnnouncement();
        fullLoop = false;
        ownSpeech?.cancel?.();
        schedule(null);
      } else if (!timer && !waiting && eligible()) schedule(null);
    }
    function open(next, { restoreId = null } = {}) {
      if (disposed) return;
      stopClock();
      ownSpeech?.cancel?.();
      items = validate(next);
      parents = [];
      inputHeld = false;
      index = restoreId === null ? -1 : items.findIndex(item => identify(item) === restoreId);
      parked = false;
      braked = false;
      held = null;
      loops = 0;
      fullLoop = index === 0;
      loopDirection = 1;
      land(index);
    }
    function enterGroup(next, {restoreId=null, wrap=false} = {}) {
      if (disposed || index < 0) return false;
      const children = validate(next);
      if (!children.length) return false;
      const childIndex=restoreId===null?0:children.findIndex(item=>identify(item)===restoreId);
      if(childIndex<0)return false;
      parents.push({ items, id: identify(items[index]), wrap: wrap === true });
      items = children;
      fullLoop = true;
      loopDirection = 1;
      loops = 0;
      land(childIndex);
      return true;
    }
    function back({ restore = true } = {}) {
      if (!parents.length || disposed) return false;
      const parent = parents.pop();
      items = parent.items;
      parked = false;
      braked = false;
      held = null;
      fullLoop = false;
      // A reset returns to root, because -1 exists ONLY at the top level.
      if (!restore) while (parents.length) items = parents.pop().items;
      land(restore ? items.findIndex(item => identify(item) === parent.id) : -1);
      return true;
    }
    function activity(active) {
      if (inactive === !active) return;
      inactive = !active;
      clearPauseAnnouncement();
      stopClock();
      // Lost focus must never leave a half-held key stranded.
      if (held?.braking) braked = held.wasBraked;
      held = null;
      inputHeld = false;
      draw();
      if (active) schedule(null);
    }
    function onSettings(next) {
      const previous = prefs;
      prefs = next;
      // Cancel only this scanner's parking label, including queued starts and
      // native speech that outlived its completion cap. Explicit setting or
      // app narration is not a parking label even when the index is blank.
      const silencedParking = parkingSpeech && (!next.autoScan || next.parking === 'off');
      if (silencedParking) {
        clearPauseAnnouncement();
        parkingSpeech.cancel?.();
        if (ownSpeech === parkingSpeech) ownSpeech = null;
        parkingSpeech = null;
        stopClock();
      }
      if (previous.autoScan !== next.autoScan) {
        clearPauseAnnouncement();
        // A setting change is not navigation. Keep the current identity and
        // row stack while clearing states that belong to the previous mode.
        parked = false; braked = false; loops = 0; fullLoop = false; loopDirection = 1;
        if (held) { held.braking = false; held.waitForRelease = true; }
        stopClock();
        draw();
        schedule(null);
        return;
      }
      if (previous.parking !== next.parking || previous.loopsBeforeParking !== next.loopsBeforeParking) {
        loops = 0;
        fullLoop = false;
      }
      if (parked && next.parking === 'off') {
        parked = false; draw(); schedule(null); return;
      }
      if (braked && !next.spaceBrake) {
        clearPauseAnnouncement();
        braked = false; if (held) held.braking = false; draw(); schedule(null);
      } else if (silencedParking || previous.scanInterval !== next.scanInterval || previous.waitForSpeech !== next.waitForSpeech) {
        schedule(next.waitForSpeech ? ownSpeech : null);
      }
    }
    manager.subscribe(onSettings);
    const stopActivity = window.NarbePlatform.lifecycle.onActivity(activity);
    const api = {
      getState: state, readyToAdvance, step, select, park, resume, brakePress, brakeRelease, announceCurrent,
      setItems: replaceItems, open, enterGroup, back,
      rememberFocus: () => state().id,
      // Freeze only the automatic clock while a native selection/backward key
      // is down. Manual navigation still works; this is not the Space brake.
      setInputHeld(value) {
        if (disposed || inputHeld === !!value) return;
        inputHeld = !!value;
        if (inputHeld) inputSpeech = ownSpeech;
        stopClock();
        if (!inputHeld) {
          const movedSpeech = ownSpeech !== inputSpeech ? ownSpeech : null;
          inputSpeech = null;
          schedule(movedSpeech);
        }
      },
      setSuspended(value) {
        clearPauseAnnouncement();
        suspended = !!value;
        stopClock();
        if (held?.braking) braked = held.wasBraked;
        held = null;
        inputHeld = false;
        draw();
        if (!suspended) schedule(null);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        clearPauseAnnouncement();
        stopClock();
        ownSpeech?.cancel?.();
        manager.unsubscribe(onSettings);
        stopActivity();
        badge.destroy();
      }
    };
    open(options.items || []);
    return api;
  }
  return { create };
})();

;

/* upstream: scan-manager.js */
/**
 * Shared scan settings and the existing release cooldown / anti-rapid-press guard.
 * Platform storage, frame transport and key capture live in platform.js.
 */
window.NarbeScanManager = (function () {
  'use strict';
  const SCAN_SPEEDS = [1000, 2000, 3000, 4000, 5000];
  const INPUT_SENSITIVITIES = [50, 100, 200, 300];
  const DEFAULT_SETTINGS = {
    autoScan: false, scanSpeedIndex: 1, inputSensitivityIndex: 0,
    parking: 'off', loopsBeforeParking: 2, spaceBrake: true, waitForSpeech: false
  };
  const valid = {
    autoScan: value => typeof value === 'boolean',
    scanSpeedIndex: value => Number.isInteger(value) && value >= 0 && value < SCAN_SPEEDS.length,
    inputSensitivityIndex: value => Number.isInteger(value) && value >= 0 && value < INPUT_SENSITIVITIES.length,
    parking: value => ['off', 'chosen', 'auto'].includes(value),
    loopsBeforeParking: value => [1, 2, 3].includes(value),
    spaceBrake: value => typeof value === 'boolean',
    waitForSpeech: value => typeof value === 'boolean'
  };
  function normalize(raw) {
    const next = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(valid)) {
      if (valid[key](raw?.[key])) next[key] = raw[key];
    }
    return next;
  }
  let settings;
  let observers = [];
  function getPublicState(value = settings) {
    return {
      ...value,
      scanInterval: SCAN_SPEEDS[value.scanSpeedIndex],
      inputSensitivity: INPUT_SENSITIVITIES[value.inputSensitivityIndex]
    };
  }
  const store = window.NarbePlatform.settings.open({
    key: 'narbe-scan-settings', normalize, project: getPublicState,
    onChange(value) {
      settings = value;
      for (const callback of [...observers]) {
        try { callback(getPublicState()); } catch (error) { console.error('NarbeScanManager: observer', error); }
      }
    }
  });
  settings = store.readCached();
  function getInputSensitivity() { return INPUT_SENSITIVITIES[settings.inputSensitivityIndex]; }
  function updateSettings(patch) {
    if (!patch || typeof patch !== 'object') return;
    const next = { ...settings };
    for (const key of Object.keys(valid)) {
      if (valid[key](patch[key])) next[key] = patch[key];
    }
    settings = store.save(next);
  }

  // A valid press has NO minimum length. The original guard consumes BOTH ends
  // of a bounce, but always lets a valid short press release reach the app.
  let lastValidReleaseTime = 0;      // Last release that passed the duration check
  const lastKeyDownTimes = {};       // Per-key keydown timestamps
  const lastKeyUpTimes = {};         // Per-key keyup timestamps (rapid-press detection)
  const blockedInteractions = new Set(); // IDs currently in a blocked sequence
  const keyPressStartTimes = {};     // Per-key press start (hold duration check)
  const acceptedHeld = new Set();    // Keys whose current press was let through and is still down

  /**
   * Reset all input tracking state.
   * CRITICAL: call this when transitioning from an iframe back to the hub, or a
   * key that was down when the iframe closed stays flagged and the hub stops
   * responding to the player's switch with nobody able to clear it.
   */
  function resetInputState() {
    lastValidReleaseTime = 0;
    for (const key in lastKeyDownTimes) delete lastKeyDownTimes[key];
    for (const key in lastKeyUpTimes) delete lastKeyUpTimes[key];
    for (const key in keyPressStartTimes) delete keyPressStartTimes[key];
    blockedInteractions.clear();
    acceptedHeld.clear();
  }

  function handleGlobalInput(e) {
    let id;
    let isTargetEvent = false;

    // 1. Identify Source
    if (e.type.startsWith('key')) {
      // Only target Space and Enter - the two keys a switch interface sends
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        id = e.code;
        isTargetEvent = true;
      }
    } else {
      // Mouse and touch provide direct navigation, not switch input,
      // so they are not filtered. Bounce only happens on physical switches.
      return;
    }

    // Pass through non-target keys (e.g. arrows, letters)
    if (!isTargetEvent) return;

    // 2. Start of Sequence (Down)
    if (e.type === 'keydown' || e.type === 'mousedown' || e.type === 'touchstart') {

      const now = Date.now();
      const sensitivity = getInputSensitivity();

      // Auto-repeat of a press that was already let through is not a new press.
      // The cooldown below must not catch it: releasing the OTHER switch while
      // this one is held starts a cooldown, and blocking a repeat here would
      // also swallow this key's release, so a held Enter would charge forever.
      if (e.repeat && acceptedHeld.has(id)) return;

      // Strict global cooldown from the last VALID release
      if (now - lastValidReleaseTime < sensitivity) {
        blockedInteractions.add(id);
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
      }

      // ANTI-RAPID-PRESS: block if this key was released too recently (any
      // release, valid or not). Stops rapid tapping being read as a long hold.
      const lastUpForThisKey = lastKeyUpTimes[id] || 0;
      if (!e.repeat && now - lastUpForThisKey < sensitivity) {
        blockedInteractions.add(id);
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
      }

      // Block if this source is already flagged (e.g. held-down repeats)
      if (blockedInteractions.has(id)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
      }

      // Allowed: record start time for the duration check on release
      if (!e.repeat) {
        keyPressStartTimes[id] = now;
        lastKeyDownTimes[id] = now;
        acceptedHeld.add(id);
      }
    }

    // 3. End of Sequence (Up/Click)
    else if (e.type === 'keyup' || e.type === 'mouseup' || e.type === 'touchend' ||
             e.type === 'click' || e.type === 'touchcancel') {

      const now = Date.now();
      const isFinalEvent = (e.type === 'keyup' || e.type === 'click' ||
                            e.type === 'touchend' || e.type === 'touchcancel');

      // Always record keyup time for rapid-press detection on the next keydown
      if (isFinalEvent) {
        lastKeyUpTimes[id] = now;
        acceptedHeld.delete(id);
      }

      // If this sequence was blocked, consume the release and clear the flag
      if (blockedInteractions.has(id)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        if (isFinalEvent) {
          blockedInteractions.delete(id);
          delete keyPressStartTimes[id];
        }
        return false;
      }

      // 4. NO minimum-hold check here, and that is deliberate.
      //
      // The desktop hub rejects presses shorter than the sensitivity threshold
      // by swallowing the keyup. That cannot be done safely here: by the time
      // the keyup arrives the game has already seen the keydown and started
      // whatever the press begins - a held steer, a charging meter, a
      // backwards-scan timer. Swallowing the keyup leaves that running with
      // nothing to stop it. Benny Says is the clearest case: it sets
      // spaceIsDown on keydown and only clears it on keyup, so a swallowed
      // keyup leaves it scanning backwards forever.
      //
      // narbe-input-cancelled exists as the safety net for exactly this, but
      // only 11 of 23 games listen for it, so it cannot be relied on. Until
      // every game handles it (or the guard buffers the keydown instead of
      // blocking the keyup), a press of any length is allowed through.
      //
      // Nothing is lost for tremor filtering: the cooldown and anti-rapid-press
      // checks above both block a keydown AND consume its matching keyup, so a
      // filtered press never reaches the game half-finished.
      if (keyPressStartTimes[id] && isFinalEvent) {
        delete keyPressStartTimes[id];
      }

      // Valid release: update the cooldown timer
      if (e.type === 'keyup' || e.type === 'mouseup') {
        lastValidReleaseTime = now;
      }
    }
  }


  window.NarbePlatform.input.capture(handleGlobalInput);

  const api = {
    reload() { settings = store.reload(); return getPublicState(); },
    getSettings: getPublicState,
    getScanInterval: () => SCAN_SPEEDS[settings.scanSpeedIndex],
    updateSettings,
    setAutoScan: enabled => updateSettings({ autoScan: !!enabled }),
    toggleAutoScan() { this.setAutoScan(!settings.autoScan); },
    setScanSpeedIndex: index => updateSettings({ scanSpeedIndex: index }),
    cycleScanSpeed() {
      const next = (settings.scanSpeedIndex + 1) % SCAN_SPEEDS.length;
      this.setScanSpeedIndex(next);
      return next;
    },
    subscribe(callback) {
      if (typeof callback === 'function' && !observers.includes(callback)) observers.push(callback);
    },
    unsubscribe(callback) { observers = observers.filter(item => item !== callback); },
    getAvailableSpeeds: () => [...SCAN_SPEEDS],
    getAvailableSensitivities: () => [...INPUT_SENSITIVITIES],
    getInputSensitivity,
    setInputSensitivityIndex: index => updateSettings({ inputSensitivityIndex: index }),
    cycleInputSensitivity() {
      const next = (settings.inputSensitivityIndex + 1) % INPUT_SENSITIVITIES.length;
      this.setInputSensitivityIndex(next);
      return next;
    },
    resetInputState,
    isParkingEnabled: () => settings.autoScan && settings.parking !== 'off',
    shouldParkAfterLoop: loops => settings.autoScan && settings.parking === 'auto' &&
      loops >= settings.loopsBeforeParking,
    // Explicit creation only. No app is converted just by loading this file.
    createChoiceScan(options) { return window.NarbeChoiceScan.create(api, options); }
  };
  return api;
})();

;

/* upstream: voice-manager.js */
/**
 * Shared voice settings and bounded speech completion.
 * The platform adapter owns the engine and its native events.
 */
window.NarbeVoiceManager = (function () {
  'use strict';
  const DEFAULT_SETTINGS = { ttsEnabled: true, voiceIndex: 0, voiceName: null, rate: 1, pitch: 1, volume: 1 };
  const speech = window.NarbePlatform.speech;
  let settings, englishVoices = [], voicesLoaded = false, callbacks = [], activeSpeech = null;
  function normalize(raw) {
    const result = { ...DEFAULT_SETTINGS };
    if (typeof raw?.ttsEnabled === 'boolean') result.ttsEnabled = raw.ttsEnabled;
    if (Number.isInteger(raw?.voiceIndex) && raw.voiceIndex >= 0) result.voiceIndex = raw.voiceIndex;
    if (typeof raw?.voiceName === 'string') result.voiceName = raw.voiceName;
    for (const [key, min, max] of [['rate', 0.1, 10], ['pitch', 0, 2], ['volume', 0, 1]]) {
      if (Number.isFinite(raw?.[key]) && raw[key] >= min && raw[key] <= max) result[key] = raw[key];
    }
    return result;
  }
  function notify() {
    for (const callback of [...callbacks]) {
      try { callback({ ...settings }); } catch (error) { console.warn('NarbeVoiceManager: callback', error); }
    }
  }
  const store = window.NarbePlatform.settings.open({
    key: 'narbe-voice-settings', normalize,
    onChange(value) { settings = value; if (!settings.ttsEnabled) cancel(); notify(); }
  });
  settings = store.readCached();

  function loadVoices() {
    const available = speech.getVoices();
    if (!available.length) return;
    englishVoices = available.filter(voice =>
      voice.lang?.startsWith('en-') || voice.lang === 'en' || /english/i.test(voice.name));
    if (!englishVoices.length) englishVoices = available.filter(voice => voice.lang?.startsWith('en'));
    if (!englishVoices.length) englishVoices = [available[0]];
    const byName = englishVoices.findIndex(voice => voice.name === settings.voiceName);
    const index = byName >= 0 ? byName : (settings.voiceIndex < englishVoices.length ? settings.voiceIndex : 0);
    settings = store.save({ ...settings, voiceIndex: index, voiceName: englishVoices[index].name });
    voicesLoaded = true;
    notify();
  }
  function getSettings() { return { ...settings }; }
  function updateSettings(patch) {
    if (!patch || typeof patch !== 'object') return;
    const next = normalize({ ...settings, ...patch });
    if (patch.voiceIndex !== undefined && englishVoices[next.voiceIndex]) {
      next.voiceName = englishVoices[next.voiceIndex].name;
    }
    settings = store.save(next);
  }
  function getEnglishVoices() { return [...englishVoices]; }
  function getCurrentVoice() { return englishVoices[settings.voiceIndex] || englishVoices[0] || null; }
  function getVoiceDisplayName(voice) {
    if (!voice) return "Default";
    
    const name = voice.name.toLowerCase();
    
    // Clean up voice name for better display
    let displayName = voice.name;
    
    // Remove common prefixes and suffixes for cleaner display
    displayName = displayName.replace(/^(Microsoft|Google|Apple|Samsung)\s+/i, '');
    displayName = displayName.replace(/\s+(Premium|Enhanced|Compact|Desktop|Mobile)$/i, '');
    displayName = displayName.replace(/\s+\([^)]+\)$/i, ''); // Remove parenthetical info
    
    // Take only the first word/name for simplicity
    displayName = displayName.split(' ')[0];
    
    // Capitalize first letter
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    
    return displayName;
  }


  function cycleVoice() {
    if (!englishVoices.length) return false;
    updateSettings({ voiceIndex: (settings.voiceIndex + 1) % englishVoices.length });
    return true;
  }
  function toggleTTS() {
    updateSettings({ ttsEnabled: !settings.ttsEnabled });
    return settings.ttsEnabled;
  }

  // A conservative character estimate, two seconds of grace, never over 10s.
  function getSpeechTimeout(text, rate = settings.rate) {
    return Math.min(10000, Math.ceil(String(text).length / (15 * Math.max(0.1, rate)) * 1000) + 2000);
  }
  function speak(text, options = {}) {
    cancel();
    let resolveStart, resolveFinish, done = false, nativeTicket, watchdog;
    const started = new Promise(resolve => { resolveStart = resolve; });
    const finished = new Promise(resolve => { resolveFinish = resolve; });
    let didStart = false;
    function finish(result) {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      resolveStart(result.started);
      resolveFinish(result);
      if (activeSpeech === ticket) activeSpeech = null;
      if (typeof options.onComplete === 'function') {
        try { options.onComplete(result); } catch (error) { console.warn('NarbeVoiceManager: completion', error); }
      }
    }
    const ticket = {
      started, finished,
      cancel() { nativeTicket?.cancel(); finish({ reason: 'cancelled', started: didStart }); }
    };
    activeSpeech = ticket;
    if ((!settings.ttsEnabled && !options.force) || !text) {
      finish({ reason: 'disabled', started: false });
      return ticket;
    }
    const rate = options.rate || settings.rate;
    watchdog = setTimeout(() => {
      // Release scan waiters without truncating a long spoken announcement.
      // The next speech request (or an explicit cancel) still owns cancellation.
      finish({ reason: 'timeout', started: didStart });
    }, getSpeechTimeout(text, rate));
    try {
      nativeTicket = speech.speak(String(text), {
        rate, pitch: options.pitch ?? settings.pitch, volume: options.volume ?? settings.volume,
        ...(getCurrentVoice() ? { voice: getCurrentVoice() } : {})
      });
      nativeTicket.started.then(value => { if (!done) { didStart = value; resolveStart(value); } });
      nativeTicket.finished.then(finish, () => finish({ reason: 'error', started: didStart }));
    } catch (_) { finish({ reason: 'error', started: false }); }
    return ticket;
  }
  function processTextForTTS(text) {
    // List of common 2-letter words that should be spoken as words, not letters
    const twoLetterWords = ['IT', 'IS', 'IN', 'AT', 'ON', 'TO', 'OF', 'AS', 'BY', 'IF', 
                           'OR', 'SO', 'UP', 'DO', 'GO', 'HE', 'WE', 'ME', 'BE', 'NO', 
                           'MY', 'AN', 'AM', 'US', 'OK', 'HI', 'OH', 'AH', 'HA'];
    
    return text.split(' ').map(fullWord => {
      // Handle contractions
      if (fullWord.includes("'")) {
        const parts = fullWord.split("'");
        const processedParts = parts.map((part, index) => {
          if (index === 0) {
            return part.toLowerCase();
          } else {
            return part.toLowerCase();
          }
        });
        return processedParts.join("'");
      }
      // Non-contraction words
      else {
        // Check if it's a 2-letter word that should be spoken as a word
        if (fullWord.length === 2 && twoLetterWords.includes(fullWord.toUpperCase())) {
          return fullWord.toLowerCase();
        }
        // For other all-caps words longer than 2 letters, convert to lowercase
        else if (fullWord.length > 2 && fullWord === fullWord.toUpperCase() && /^[A-Z]+$/.test(fullWord)) {
          return fullWord.toLowerCase();
        }
        // Keep single letters as uppercase (they should be spelled out)
        else if (fullWord.length === 1 && /^[A-Z]$/.test(fullWord)) {
          return fullWord;
        }
        // Default: convert to lowercase for natural speech
        else {
          return fullWord.toLowerCase();
        }
      }
    }).join(' ');
  }


  function speakProcessed(text, options = {}) { return speak(processTextForTTS(text), options); }
  function cancel() {
    activeSpeech?.cancel();
    speech.cancel();
  }
  function onSettingsChange(callback) {
    if (typeof callback === 'function' && !callbacks.includes(callback)) callbacks.push(callback);
  }
  function offSettingsChange(callback) { callbacks = callbacks.filter(item => item !== callback); }
  function areVoicesLoaded() { return voicesLoaded; }
  function waitForVoices(timeout = 2000) {
    if (voicesLoaded) return Promise.resolve(true);
    return new Promise(resolve => {
      let timer;
      const stop = speech.onVoicesChanged(() => { loadVoices(); if (voicesLoaded) finish(true); });
      function finish(value) { clearTimeout(timer); stop(); resolve(value); }
      timer = setTimeout(() => finish(voicesLoaded), Math.min(10000, Math.max(0, timeout)));
    });
  }

  loadVoices();
  speech.onVoicesChanged(loadVoices);
  if (!voicesLoaded) setTimeout(loadVoices, 100);
  return {
    getSettings, updateSettings, getEnglishVoices, getCurrentVoice,
    getVoiceDisplayName, cycleVoice, toggleTTS, speak, speakProcessed, cancel,
    processTextForTTS, onSettingsChange, offSettingsChange, areVoicesLoaded,
    waitForVoices, getSpeechTimeout
  };
})();

;