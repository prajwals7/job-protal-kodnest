/**
 * Job Notification Tracker — Hash router + job rendering
 */

var JNT_ROUTES = {
  '/': { title: 'Job Notification Tracker' },
  '/dashboard': { title: 'Dashboard' },
  '/saved': { title: 'Saved' },
  '/digest': { title: 'Digest' },
  '/settings': { title: 'Settings' },
  '/proof': { title: 'Proof' }, // Fallback for rule "Do NOT rename routes"
  '/jt/proof': { title: 'Proof' },
  '/jt/07-test': { title: 'Test Checklist' },
  '/jt/08-ship': { title: 'Ship' }
};

var JNT_STORAGE_KEY = 'jnt_saved_ids';
var JNT_PREFS_KEY = 'jnt_preferences';
var JNT_DIGEST_PREFIX = 'jobTrackerDigest_';
var JNT_STATUS_KEY = 'jnt_job_stats';
var JNT_HISTORY_KEY = 'jnt_status_history';
var JNT_PROOF_KEY = 'jnt_proof_links';

function getStatusMap() {
  try {
    var raw = localStorage.getItem(JNT_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function getJobStatus(id) {
  var map = getStatusMap();
  return map[id] || 'Not Applied';
}

function saveJobStatus(id, status) {
  var map = getStatusMap();
  map[id] = status;
  localStorage.setItem(JNT_STATUS_KEY, JSON.stringify(map));

  // Save history for digest/toast
  var history = getStatusHistory();
  history.unshift({
    id: id,
    status: status,
    timestamp: new Date().toISOString()
  });
  // Keep last 50 updates
  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem(JNT_HISTORY_KEY, JSON.stringify(history));
}

function getStatusHistory() {
  try {
    var raw = localStorage.getItem(JNT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

var JNT_CHECKLIST_KEY = 'jnt_test_checklist';
var JNT_TEST_ITEMS = [
  { id: 't1', text: 'Preferences persist after refresh', hint: 'Change keywords, refresh, verify they remain in form.' },
  { id: 't2', text: 'Match score calculates correctly', hint: 'Verify score badge appears and reflects keyword matches.' },
  { id: 't3', text: '"Show only matches" toggle works', hint: 'Toggle on, verify low-score jobs disappear.' },
  { id: 't4', text: 'Save job persists after refresh', hint: 'Save a job, refresh, check if it stays in Saved tab.' },
  { id: 't5', text: 'Apply opens in new tab', hint: 'Click Apply, ensure a new browser tab opens.' },
  { id: 't6', text: 'Status update persists after refresh', hint: 'Change status to Applied, refresh, verify badge color.' },
  { id: 't7', text: 'Status filter works correctly', hint: 'Select "Applied" filter, verify list updates.' },
  { id: 't8', text: 'Digest generates top 10 by score', hint: 'Generate digest, verify sorting and count (max 10).' },
  { id: 't9', text: 'Digest persists for the day', hint: 'Generate digest, refresh page, verify it remains visible.' },
  { id: 't10', text: 'No console errors on main pages', hint: 'Open F12 console, verify no red error messages.' }
];

function getChecklist() {
  try {
    var raw = localStorage.getItem(JNT_CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveChecklist(map) {
  localStorage.setItem(JNT_CHECKLIST_KEY, JSON.stringify(map));
}

function areAllTestsPassed() {
  var map = getChecklist();
  return JNT_TEST_ITEMS.every(function (item) {
    return map[item.id] === true;
  });
}

function getProofLinks() {
  try {
    var raw = localStorage.getItem(JNT_PROOF_KEY);
    return raw ? JSON.parse(raw) : { lovable: '', github: '', deploy: '' };
  } catch (e) { return { lovable: '', github: '', deploy: '' }; }
}

function saveProofLinks(links) {
  localStorage.setItem(JNT_PROOF_KEY, JSON.stringify(links));
}

function areAllLinksProvided() {
  var links = getProofLinks();
  return !!(links.lovable && links.github && links.deploy);
}

function getStepCompletionStatus() {
  var prefs = getPreferences();
  var checklist = getChecklist();
  var history = getStatusHistory();
  var today = new Date().toISOString().split('T')[0];
  var digest = getDigest(today);
  var links = getProofLinks();

  var passedTests = 0;
  JNT_TEST_ITEMS.forEach(function (item) { if (checklist[item.id]) passedTests++; });

  return [
    { id: 1, text: 'Landing Page Setup', completed: true },
    { id: 2, text: 'User Preferences Form', completed: prefs.roleKeywords.length > 0 || prefs.preferredLocations.length > 0 },
    { id: 3, text: 'Match Reasoning Engine', completed: true },
    { id: 4, text: 'Job Status Tracking', completed: history.length > 0 },
    { id: 5, text: 'Daily Digest Generation', completed: !!digest },
    { id: 6, text: 'Verification Checklist (10/10)', completed: passedTests === 10 },
    { id: 7, text: 'Proof Collection (Artifact Links)', completed: areAllLinksProvided() },
    { id: 8, text: 'Final Shipment Readiness', completed: passedTests === 10 && areAllLinksProvided() }
  ];
}

function getPath() {
  var hash = window.location.hash.slice(1) || '/';
  return hash.charAt(0) === '/' ? hash : '/' + hash;
}

function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function getSavedIds() {
  try {
    var raw = localStorage.getItem(JNT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveJobId(id) {
  var ids = getSavedIds();
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    localStorage.setItem(JNT_STORAGE_KEY, JSON.stringify(ids));
  }
}

function unsaveJobId(id) {
  var ids = getSavedIds().filter(function (x) { return x !== id; });
  localStorage.setItem(JNT_STORAGE_KEY, JSON.stringify(ids));
}

function isSaved(id) {
  return getSavedIds().indexOf(id) !== -1;
}

function getPreferences() {
  try {
    var raw = localStorage.getItem(JNT_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return {
    roleKeywords: [],
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: [],
    minMatchScore: 40
  };
}

function savePreferences(prefs) {
  localStorage.setItem(JNT_PREFS_KEY, JSON.stringify(prefs));
}

function getDigest(dateString) {
  try {
    var raw = localStorage.getItem(JNT_DIGEST_PREFIX + dateString);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveDigest(dateString, jobs) {
  localStorage.setItem(JNT_DIGEST_PREFIX + dateString, JSON.stringify(jobs));
}

function generateDigest(jobs, prefs) {
  if (!jobs || jobs.length === 0) {
    console.warn('JNT: No jobs available for digest generation');
    return [];
  }
  // Score all jobs
  var scored = jobs.map(function (j) {
    var j2 = {}; for (var k in j) j2[k] = j[k];
    j2.score = calculateMatchScore(j, prefs);
    return j2;
  });

  // Filter out zero-score jobs to ensure quality? No, user wants top 10 regardless.
  // But if all are 0, it might look broken.

  // Sort by Score (Desc) then Posted (Asc) - want fresh high matches
  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0);
  });

  console.log('JNT: Generated digest with top job score:', scored[0].score);
  return scored.slice(0, 10);
}

function formatDigestText(jobs) {
  var lines = ['Top 10 Jobs For You — 9AM Digest', 'Date: ' + new Date().toLocaleDateString(), '', '----------------------------------------'];
  jobs.forEach(function (j, i) {
    lines.push((i + 1) + '. ' + j.title + ' at ' + j.company);
    lines.push('   Location: ' + j.location + ' | Mode: ' + j.mode);
    lines.push('   Match Score: ' + j.score + '/100');
    lines.push('   Apply: ' + (j.applyUrl || '#'));
    lines.push('');
  });
  lines.push('----------------------------------------');
  lines.push('Generated by Job Notification Tracker');
  return lines.join('\n');
}

function formatPosted(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return days + ' days ago';
}

function getUniqueValues(jobs, key) {
  var set = {};
  jobs.forEach(function (j) {
    var v = j[key];
    if (v) set[v] = true;
  });
  return Object.keys(set).sort();
}

function calculateMatchScore(job, prefs) {
  if (!prefs) return 0;
  var score = 0;

  var keywords = prefs.roleKeywords || [];
  var titleMatch = keywords.some(function (k) { return k && job.title.toLowerCase().indexOf(k.toLowerCase()) !== -1; });
  if (titleMatch) score += 25;

  var descMatch = keywords.some(function (k) { return k && (job.description || '').toLowerCase().indexOf(k.toLowerCase()) !== -1; });
  if (descMatch) score += 15;

  var locs = prefs.preferredLocations || [];
  var locMatch = locs.some(function (l) { return l && job.location.toLowerCase().indexOf(l.toLowerCase()) !== -1; });
  if (locMatch) score += 15;

  var modes = prefs.preferredMode || [];
  if (modes.indexOf(job.mode) !== -1) score += 10;

  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) score += 10;

  var jobSkills = (job.skills || []).map(function (s) { return s.toLowerCase(); });
  var userSkills = (prefs.skills || []).map(function (s) { return s.toLowerCase(); });
  var skillMatch = userSkills.some(function (s) { return jobSkills.indexOf(s) !== -1; });
  if (skillMatch) score += 15;

  if (job.postedDaysAgo <= 2) score += 5;
  if (job.source === 'LinkedIn') score += 5;

  return Math.min(score, 100);
}

function filterAndSortJobs(jobs, filters, prefs) {
  var f = filters || {};
  var list = jobs.slice();

  if (f.showMatchesOnly && prefs) {
    list = list.filter(function (j) { return j.score >= (prefs.minMatchScore || 40); });
  }

  if (f.keyword) {
    var terms = f.keyword.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter(function (j) {
      return terms.every(function (t) {
        return (j.title && j.title.toLowerCase().indexOf(t) !== -1) ||
          (j.company && j.company.toLowerCase().indexOf(t) !== -1);
      });
    });
  }
  if (f.location) list = list.filter(function (j) { return j.location === f.location; });
  if (f.mode) list = list.filter(function (j) { return j.mode === f.mode; });
  if (f.experience) list = list.filter(function (j) { return j.experience === f.experience; });
  if (f.source) list = list.filter(function (j) { return j.source === f.source; });

  // Status Filter
  if (f.status) {
    list = list.filter(function (j) {
      var s = getJobStatus(j.id);
      return s === f.status;
    });
  }

  var sortBy = f.sort || 'Latest';
  if (sortBy === 'Match Score') {
    list.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  } else if (sortBy === 'Latest') {
    list.sort(function (a, b) { return (a.postedDaysAgo || 99) - (b.postedDaysAgo || 99); });
  } else if (sortBy === 'Oldest') {
    list.sort(function (a, b) { return (b.postedDaysAgo || 0) - (a.postedDaysAgo || 0); });
  } else if (sortBy === 'Company A-Z') {
    list.sort(function (a, b) { return (a.company || '').localeCompare(b.company || ''); });
  }

  return list;
}

function renderJobCard(job, showUnsave) {
  var saved = isSaved(job.id);
  var saveLabel = showUnsave && saved ? 'Unsave' : 'Save';
  var status = getJobStatus(job.id);

  // Status Badge Logic
  var statusClass = 'jnt-status--neutral';
  var statusLabel = 'Not Applied';

  if (status === 'Applied') { statusClass = 'jnt-status--blue'; statusLabel = 'Applied'; }
  else if (status === 'Rejected') { statusClass = 'jnt-status--red'; statusLabel = 'Rejected'; }
  else if (status === 'Selected') { statusClass = 'jnt-status--green'; statusLabel = 'Selected'; }

  var statusBadge = '<span class="jnt-status-badge ' + statusClass + '">' + statusLabel + '</span>';

  var scoreBadge = '';
  if (typeof job.score === 'number') {
    var badgeClass = 'jnt-score-badge--grey';
    if (job.score >= 80) badgeClass = 'jnt-score-badge--green';
    else if (job.score >= 60) badgeClass = 'jnt-score-badge--amber';
    else if (job.score >= 40) badgeClass = 'jnt-score-badge--neutral';

    scoreBadge = '<span class="jnt-score-badge ' + badgeClass + '">' + job.score + '% Match</span>';
  }

  // Status Action Buttons (Small)
  var statusActions = '<div class="jnt-status-actions">' +
    '<button type="button" class="jnt-btn-status" data-status="Applied" title="Mark Applied">Applied</button>' +
    '<button type="button" class="jnt-btn-status" data-status="Rejected" title="Mark Rejected">Rejected</button>' +
    '<button type="button" class="jnt-btn-status" data-status="Selected" title="Mark Selected">Selected</button>' +
    '<button type="button" class="jnt-btn-status jnt-btn-status--reset" data-status="Not Applied" title="Reset">Reset</button>' +
    '</div>';

  return '<div class="jnt-job-card" data-job-id="' + escapeHtml(job.id) + '">' +
    '<div class="jnt-job-card__header">' +
    '<h3 class="jnt-job-card__title">' + escapeHtml(job.title) + '</h3>' +
    scoreBadge +
    '</div>' +
    '<div style="margin-bottom: 8px; display:flex; gap:8px; align-items:center;">' +
    '<span class="jnt-job-card__source jnt-source--' + (job.source || '').toLowerCase() + '">' + escapeHtml(job.source) + '</span>' +
    statusBadge +
    '</div>' +
    '<p class="jnt-job-card__company">' + escapeHtml(job.company) + '</p>' +
    '<p class="jnt-job-card__meta">' +
    escapeHtml(job.location || '') + ' · ' + escapeHtml(job.mode || '') + ' · ' + escapeHtml(job.experience || '') +
    '</p>' +
    '<p class="jnt-job-card__salary">' + escapeHtml(job.salaryRange || '') + '</p>' +
    '<p class="jnt-job-card__posted">' + formatPosted(job.postedDaysAgo || 0) + '</p>' +
    statusActions +
    '<div class="jnt-job-card__actions">' +
    '<button type="button" class="kn-btn kn-btn--secondary jnt-btn-view">View</button>' +
    '<button type="button" class="kn-btn kn-btn--secondary jnt-btn-save' + (saved ? ' is-saved' : '') + '">' + saveLabel + '</button>' +
    '<a href="' + escapeHtml(job.applyUrl || '#') + '" target="_blank" rel="noopener" class="kn-btn kn-btn--primary jnt-btn-apply">Apply</a>' +
    '</div>' +
    '</div>';
}

function renderFilterBar(locations, modeValues, experienceValues, sourceValues, currentFilters) {
  var f = currentFilters || {};
  return '<div class="jnt-filter-bar">' +
    '<input type="text" class="kn-input jnt-filter-keyword" placeholder="Search title or company" value="' + escapeHtml(f.keyword || '') + '">' +
    '<select class="kn-input kn-select jnt-filter-location">' +
    '<option value="">All locations</option>' +
    (locations || []).map(function (l) {
      return '<option value="' + escapeHtml(l) + '"' + (f.location === l ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
    }).join('') +
    '</select>' +
    '<select class="kn-input kn-select jnt-filter-mode">' +
    '<option value="">All modes</option>' +
    (['Remote', 'Hybrid', 'Onsite']).map(function (m) {
      return '<option value="' + escapeHtml(m) + '"' + (f.mode === m ? ' selected' : '') + '>' + escapeHtml(m) + '</option>';
    }).join('') +
    '</select>' +
    '<select class="kn-input kn-select jnt-filter-experience">' +
    '<option value="">All experience</option>' +
    (experienceValues || []).map(function (e) {
      return '<option value="' + escapeHtml(e) + '"' + (f.experience === e ? ' selected' : '') + '>' + escapeHtml(e) + '</option>';
    }).join('') +
    '</select>' +
    '<select class="kn-input kn-select jnt-filter-source">' +
    '<option value="">All sources</option>' +
    (sourceValues || []).map(function (s) {
      return '<option value="' + escapeHtml(s) + '"' + (f.source === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>';
    }).join('') +
    '</select>' +
    '<select class="kn-input kn-select jnt-filter-status">' +
    '<option value="">All statuses</option>' +
    (['Not Applied', 'Applied', 'Rejected', 'Selected']).map(function (s) {
      return '<option value="' + escapeHtml(s) + '"' + (f.status === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>';
    }).join('') +
    '</select>' +
    '<select class="kn-input kn-select jnt-filter-sort">' +
    '<option value="Latest"' + (f.sort === 'Latest' ? ' selected' : '') + '>Latest</option>' +
    '<option value="Match Score"' + (f.sort === 'Match Score' ? ' selected' : '') + '>Match Score</option>' +
    '<option value="Oldest"' + (f.sort === 'Oldest' ? ' selected' : '') + '>Oldest</option>' +
    '<option value="Company A-Z"' + (f.sort === 'Company A-Z' ? ' selected' : '') + '>Company A-Z</option>' +
    '</select>' +
    '<div class="jnt-toggle-wrap">' +
    '<label class="jnt-toggle">' +
    '<input type="checkbox" class="jnt-filter-match-toggle" ' + (f.showMatchesOnly ? 'checked' : '') + '>' +
    '<span class="jnt-toggle-slider"></span>' +
    '</label>' +
    '<span class="jnt-toggle-label" title="Show only jobs above my threshold">Top Matches</span>' +
    '</div>' +
    '</div>';
}

function getCurrentFilters() {
  var kw = document.querySelector('.jnt-filter-keyword');
  var loc = document.querySelector('.jnt-filter-location');
  var mode = document.querySelector('.jnt-filter-mode');
  var exp = document.querySelector('.jnt-filter-experience');
  var src = document.querySelector('.jnt-filter-source');
  var stat = document.querySelector('.jnt-filter-status');
  var sort = document.querySelector('.jnt-filter-sort');
  var toggle = document.querySelector('.jnt-filter-match-toggle');
  return {
    keyword: kw ? kw.value.trim() : '',
    location: loc ? loc.value : '',
    mode: mode ? mode.value : '',
    experience: exp ? exp.value : '',
    source: src ? src.value : '',
    status: stat ? stat.value : '',
    sort: sort ? sort.value : 'Latest',
    showMatchesOnly: toggle ? toggle.checked : false
  };
}

function showModal(job) {
  var body = document.getElementById('jnt-modal__body');
  var modal = document.getElementById('jnt-modal');
  if (!body || !modal) return;
  body.innerHTML =
    '<h3 class="jnt-modal__title">' + escapeHtml(job.title) + '</h3>' +
    '<p class="jnt-modal__company">' + escapeHtml(job.company) + '</p>' +
    '<p class="jnt-modal__meta">' + escapeHtml(job.location) + ' · ' + escapeHtml(job.mode) + ' · ' + escapeHtml(job.experience) + '</p>' +
    '<div class="jnt-modal__skills">' +
    (job.skills && job.skills.length ? '<strong>Skills:</strong> ' + job.skills.map(function (s) { return escapeHtml(s); }).join(', ') : '') +
    '</div>' +
    '<p class="jnt-modal__desc">' + escapeHtml(job.description || '') + '</p>';
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function hideModal() {
  var modal = document.getElementById('jnt-modal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'jnt-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(function () {
    toast.classList.add('is-visible');
  });

  setTimeout(function () {
    toast.classList.remove('is-visible');
    setTimeout(function () {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

function bindDashboardEvents(container, jobs) {
  if (!container) return;
  container.addEventListener('click', function (e) {
    var card = e.target.closest('.jnt-job-card');
    if (!card) return;
    var id = card.getAttribute('data-job-id');
    var job = jobs.find(function (j) { return j.id === id; });
    if (!job) return;

    // Status Buttons
    if (e.target.classList.contains('jnt-btn-status')) {
      var status = e.target.getAttribute('data-status');
      saveJobStatus(id, status);
      showToast('Status updated: ' + status);

      // Update UI without full re-render if possible, or just re-render
      // For simplicity and consistency (filtering etc), let's re-render the view
      // But re-rendering entire list might lose scroll position. 
      // Let's try to update just the card? 
      // Actually, if we filter by status, this card might need to disappear.
      // So re-rendering is safer for correctness.
      if (getPath() === '/dashboard') {
        // Trigger filter event to re-render grid
        var filterWrap = document.querySelector('.jnt-filter-wrap');
        if (filterWrap) {
          // We can't easily trigger the exact filter logic from here without extracting it better
          // or we can just access the function if we had it in scope.
          // Simplest: Call handleRoute() to refresh everything.
          handleRoute();
        }
      } else {
        handleRoute();
      }
      return;
    }

    if (e.target.closest('.jnt-btn-view')) {
      showModal(job);
    } else if (e.target.closest('.jnt-btn-save')) {
      if (isSaved(id)) {
        unsaveJobId(id);
        if (getPath() === '/saved') handleRoute();
      } else {
        saveJobId(id);
      }
      // UI update for Save button is handled by re-render if we routed, 
      // or we can update button state manually if we didn't route (dashboard).
      // If we didn't route:
      if (getPath() === '/dashboard') {
        var btn = card.querySelector('.jnt-btn-save');
        if (btn) {
          btn.textContent = isSaved(id) ? 'Unsave' : 'Save';
          btn.classList.toggle('is-saved', isSaved(id));
        }
      }
    }
  });
}

function bindFilterEvents(container, jobs, onFilter) {
  if (!container) return;
  var inputs = container.querySelectorAll('.jnt-filter-keyword, .jnt-filter-location, .jnt-filter-mode, .jnt-filter-experience, .jnt-filter-source, .jnt-filter-status, .jnt-filter-sort');
  inputs.forEach(function (el) {
    el.addEventListener('change', onFilter);
    el.addEventListener('input', function () {
      if (el.classList.contains('jnt-filter-keyword')) onFilter();
    });
  });
  var toggle = container.querySelector('.jnt-filter-match-toggle');
  if (toggle) toggle.addEventListener('change', onFilter);
}

function renderLanding() {
  return '<div class="jnt-landing">' +
    '<h1 class="jnt-heading jnt-heading--hero">Stop Missing The Right Jobs.</h1>' +
    '<p class="jnt-subtext jnt-subtext--large">Precision-matched job discovery delivered daily at 9AM.</p>' +
    '<a href="#/settings" class="kn-btn kn-btn--primary jnt-cta">Start Tracking</a>' +
    '</div>';
}

function renderSettings() {
  var prefs = getPreferences();
  return '<div class="jnt-settings">' +
    '<h1 class="jnt-heading">Settings</h1>' +
    '<p class="jnt-subtext">Configure your job preferences to activate intelligent matching.</p>' +
    '<form class="kn-card jnt-settings-form" id="jnt-settings-form">' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Role keywords (comma-separated)</label>' +
    '<input type="text" name="roleKeywords" class="kn-input" placeholder="e.g. Frontend, React, Product Manager" value="' + escapeHtml(prefs.roleKeywords.join(', ')) + '">' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Preferred locations (comma-separated)</label>' +
    '<input type="text" name="preferredLocations" class="kn-input" placeholder="e.g. New York, Bangalore, Remote" value="' + escapeHtml(prefs.preferredLocations.join(', ')) + '">' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Preferred Mode</label>' +
    '<div class="jnt-checkbox-group">' +
    (['Remote', 'Hybrid', 'Onsite']).map(function (m) {
      var checked = prefs.preferredMode.indexOf(m) !== -1 ? 'checked' : '';
      return '<label class="jnt-checkbox"><input type="checkbox" name="preferredMode" value="' + m + '" ' + checked + '> ' + m + '</label>';
    }).join('') +
    '</div>' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Experience level</label>' +
    '<select name="experienceLevel" class="kn-input kn-select">' +
    '<option value="">Select level</option>' +
    (['Fresher', '0-1', '1-3', '3-5', '5+']).map(function (e) {
      var selected = prefs.experienceLevel === e ? 'selected' : '';
      return '<option value="' + e + '" ' + selected + '>' + e + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Skills (comma-separated)</label>' +
    '<input type="text" name="skills" class="kn-input" placeholder="e.g. Java, Python, React" value="' + escapeHtml(prefs.skills.join(', ')) + '">' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Minimum Match Score: <span id="jnt-score-val">' + prefs.minMatchScore + '</span></label>' +
    '<input type="range" name="minMatchScore" class="kn-slider" min="0" max="100" value="' + prefs.minMatchScore + '" oninput="document.getElementById(\'jnt-score-val\').textContent = this.value">' +
    '</div>' +
    '<div class="jnt-form-actions">' +
    '<button type="submit" class="kn-btn kn-btn--primary">Save Preferences</button>' +
    '</div>' +
    '</form>' +
    '</div>';
}

function bindSettingsEvents(container) {
  var form = container.querySelector('#jnt-settings-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var formData = new FormData(form);
    var prefs = {
      roleKeywords: formData.get('roleKeywords').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      preferredLocations: formData.get('preferredLocations').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      preferredMode: [],
      experienceLevel: formData.get('experienceLevel'),
      skills: formData.get('skills').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      minMatchScore: parseInt(formData.get('minMatchScore'), 10)
    };

    // Handle checkboxes
    form.querySelectorAll('input[name="preferredMode"]:checked').forEach(function (el) {
      prefs.preferredMode.push(el.value);
    });

    savePreferences(prefs);
    alert('Preferences saved!');
  });
}

function renderDashboard() {
  var rawJobs = typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : [];
  var prefs = getPreferences();

  // Calculate scores
  var jobs = rawJobs.map(function (j) {
    var score = calculateMatchScore(j, prefs);
    // Be careful not to mutate original object permanently if this runs multiple times on same objects, 
    // but here we are mapping to new objects or adding property. 
    // Since JNT_JOBS is global, let's create a shallow copy with score.
    var j2 = Object.create(j);
    // Object.create uses j as prototype, so properties are inherited. 
    // But we want to easily access them. Better to assign.
    for (var key in j) j2[key] = j[key];
    j2.score = score;
    return j2;
  });

  var filters = getCurrentFilters();
  var filtered = filterAndSortJobs(jobs, filters, prefs);

  var locations = getUniqueValues(jobs, 'location');
  var experienceValues = getUniqueValues(jobs, 'experience');
  var sourceValues = getUniqueValues(jobs, 'source');

  var filterHtml = renderFilterBar(locations, ['Remote', 'Hybrid', 'Onsite'], experienceValues, sourceValues, filters);
  var cardsHtml = filtered.map(function (j) { return renderJobCard(j, false); }).join('');

  // Check if preferences are set
  var hasPrefs = prefs.roleKeywords.length > 0 || prefs.preferredLocations.length > 0;
  var bannerHtml = '';
  if (!hasPrefs) {
    bannerHtml = '<div class="jnt-banner">' +
      '<p class="jnt-banner__text"><strong>Customize your feed:</strong> Set your preferences to see match scores and personalized recommendations.</p>' +
      '<a href="#/settings" class="jnt-banner__link">Set Preferences &rarr;</a>' +
      '</div>';
  }

  var emptyHtml = '<div class="kn-empty jnt-empty"><p class="kn-empty__title">No jobs match your filters.</p><p class="kn-empty__hint">Try adjusting filters or search keyword.</p></div>';

  if (filtered.length === 0 && filters.showMatchesOnly) {
    emptyHtml = '<div class="kn-empty kn-empty--premium">' +
      '<p class="kn-empty__title">No roles match your criteria</p>' +
      '<p class="kn-empty__hint">Try lowering your match threshold in settings or adjusting your filters.</p>' +
      '</div>';
  }

  var html = '<div class="jnt-dashboard">' +
    '<h1 class="jnt-heading">Dashboard</h1>' +
    '<p class="jnt-subtext">Your daily job feed.</p>' +
    bannerHtml +
    '<div class="jnt-filter-wrap">' + filterHtml + '</div>' +
    '<div class="jnt-job-grid" id="jnt-job-grid">' +
    (filtered.length ? cardsHtml : emptyHtml) +
    '</div>' +
    '</div>';

  return html;
}

function renderSaved() {
  var jobs = typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : [];
  var savedIds = getSavedIds();
  var prefs = getPreferences();
  var savedJobs = jobs.filter(function (j) { return savedIds.indexOf(j.id) !== -1; }).map(function (j) {
    var j2 = {}; for (var k in j) j2[k] = j[k];
    j2.score = calculateMatchScore(j, prefs);
    return j2;
  });

  var cardsHtml = savedJobs.map(function (j) { return renderJobCard(j, true); }).join('');

  var content = savedJobs.length
    ? '<div class="jnt-job-grid" id="jnt-saved-grid">' + cardsHtml + '</div>'
    : '<div class="kn-empty jnt-empty"><p class="kn-empty__title">No saved jobs.</p><p class="kn-empty__hint">Save jobs from the dashboard to review them here.</p></div>';

  return '<div class="jnt-saved">' +
    '<h1 class="jnt-heading">Saved</h1>' +
    '<p class="jnt-subtext">Jobs you have saved for later.</p>' +
    content +
    '</div>';
}

function renderDigest() {
  var prefs = getPreferences();
  var hasPrefs = prefs.roleKeywords.length > 0 || prefs.preferredLocations.length > 0 || prefs.preferredMode.length > 0 || prefs.experienceLevel;

  if (!hasPrefs) {
    return '<div class="jnt-digest">' +
      '<h1 class="jnt-heading">Digest</h1>' +
      '<p class="jnt-subtext">Your daily 9AM precision-matched roundup.</p>' +
      '<div class="kn-empty jnt-empty">' +
      '<p class="kn-empty__title">Preferences required</p>' +
      '<p class="kn-empty__hint">Set your preferences in Settings to activate your personalized daily digest.</p>' +
      '<a href="#/settings" class="kn-btn kn-btn--primary" style="margin-top: 1rem;">Go to Settings</a>' +
      '</div>' +
      '</div>';
  }

  var today = new Date().toISOString().split('T')[0];
  var digest = getDigest(today);

  if (!digest) {
    return '<div class="jnt-digest">' +
      '<h1 class="jnt-heading">Digest</h1>' +
      '<p class="jnt-subtext">Your daily 9AM precision-matched roundup.</p>' +
      '<div class="jnt-digest-start">' +
      '<div class="kn-card" style="text-align: center; padding: 3rem;">' +
      '<p style="margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--kn-text-muted);">Your personalized digest for <strong>' + today + '</strong> is ready to be generated.</p>' +
      '<button type="button" class="kn-btn kn-btn--primary jnt-btn-generate-digest">Generate Today\'s 9AM Digest (Simulated)</button>' +
      '<p style="margin-top: 1rem; font-size: 0.8rem; color: #9CA3AF;">This will trigger the daily ranking engine based on your current preferences.</p>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  // Render Email UI
  var listHtml = digest.map(function (j, i) {
    var badgeColor = '#E5E7EB'; // grey
    if (j.score >= 80) badgeColor = '#DCFCE7'; // green
    else if (j.score >= 60) badgeColor = '#FEF3C7'; // amber
    else if (j.score >= 40) badgeColor = '#F3F4F6'; // neutral

    var status = getJobStatus(j.id);
    var statusBadge = '';
    if (status !== 'Not Applied') {
      var sColor = '#666';
      if (status === 'Applied') sColor = '#0369A1';
      else if (status === 'Rejected') sColor = '#991B1B';
      else if (status === 'Selected') sColor = '#166534';
      statusBadge = '<span style="font-size: 10px; color: ' + sColor + '; margin-left: 8px; font-weight: 600;">[' + status + ']</span>';
    }

    // Inline styles for email feel
    return '<div class="jnt-digest-item" style="padding: 16px; border-bottom: 1px solid #eee;">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">' +
      '<h3 style="margin: 0; font-size: 16px; color: #111;">' + (i + 1) + '. ' + escapeHtml(j.title) + statusBadge + '</h3>' +
      '<span style="background: ' + badgeColor + '; font-size: 11px; padding: 2px 6px; border-radius: 99px; font-weight: 700;">' + j.score + '% Match</span>' +
      '</div>' +
      '<p style="margin: 0 0 4px; color: #444; font-size: 14px;">' + escapeHtml(j.company) + '</p>' +
      '<p style="margin: 0 0 8px; color: #666; font-size: 12px;">' + escapeHtml(j.location) + ' · ' + escapeHtml(j.mode) + ' · ' + escapeHtml(j.experience) + '</p>' +
      '<a href="' + escapeHtml(j.applyUrl || '#') + '" target="_blank" style="font-size: 13px; color: var(--kn-accent); text-decoration: none; font-weight: 500;">Apply Now &rarr;</a>' +
      '</div>';
  }).join('');

  if (digest.length === 0) {
    listHtml = '<div style="padding: 32px; text-align: center; color: #666;">No matching roles found today based on your preferences.</div>';
  }

  // RECENT STATUS UPDATES
  var historyHtml = '';
  var history = getStatusHistory();
  // Filter for last 24h? or just last 5 updates? Let's show last 3-5 updates regardless of time for visibility in demo
  var recentUpdates = history.slice(0, 5);

  if (recentUpdates.length > 0) {
    var jobs = typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : [];
    var updatesList = recentUpdates.map(function (h) {
      var job = jobs.find(function (j) { return j.id === h.id; });
      if (!job) return '';

      var date = new Date(h.timestamp).toLocaleDateString() + ' ' + new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var statusColor = '#666';
      if (h.status === 'Applied') statusColor = '#0369A1';
      else if (h.status === 'Rejected') statusColor = '#991B1B';
      else if (h.status === 'Selected') statusColor = '#166534';

      return '<div style="padding: 12px; border-bottom: 1px solid #eee; font-size: 13px;">' +
        '<div style="display:flex; justify-content:space-between;">' +
        '<strong>' + escapeHtml(job.title) + '</strong>' +
        '<span style="color:' + statusColor + '; font-weight:600;">' + h.status + '</span>' +
        '</div>' +
        '<div style="color:#666;">' + escapeHtml(job.company) + ' · ' + date + '</div>' +
        '</div>';
    }).join('');

    if (updatesList) {
      historyHtml = '<div style="margin-top: 24px; border-top: 2px solid #eee; padding-top: 16px;">' +
        '<h3 style="margin: 0 0 12px; font-size: 16px; color: #111;">Recent Status Updates</h3>' +
        '<div style="background: #FAFAFA; border: 1px solid #eee; border-radius: 8px;">' + updatesList + '</div>' +
        '</div>';
    }
  }

  return '<div class="jnt-digest">' +
    '<h1 class="jnt-heading">Digest</h1>' +
    '<p class="jnt-subtext">Your daily 9AM precision-matched roundup.</p>' +
    '<div class="jnt-digest-actions" style="margin: 16px 0; display: flex; gap: 8px;">' +
    '<button type="button" class="kn-btn kn-btn--secondary jnt-btn-copy-digest">Copy Digest to Clipboard</button>' +
    '<a href="mailto:?subject=My%209AM%20Job%20Digest&body=(Content%20will%20be%20pasted%20here)" class="kn-btn kn-btn--secondary jnt-btn-email-digest" target="_blank">Create Email Draft</a>' +
    '</div>' +
    '<div class="jnt-digest-container" style="background: #F3F4F6; padding: 2rem; border-radius: 8px;">' +
    '<div class="jnt-digest-card" style="background: white; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">' +
    '<div style="background: var(--kn-bg); padding: 24px; border-bottom: 2px solid var(--kn-accent);">' +
    '<h2 style="margin: 0 0 8px; font-family:serif; font-size: 20px;">Top 10 Jobs For You</h2>' +
    '<p style="margin: 0; color: #666; font-size: 14px;">9AM Digest · ' + new Date(today).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</p>' +
    '</div>' +
    '<div class="jnt-digest-body">' + listHtml + '</div>' +
    '<div style="padding: 16px;">' + historyHtml + '</div>' +
    '<div style="padding: 16px; background: #F9FAFB; border-top: 1px solid #eee; text-align: center;">' +
    '<p style="margin: 0; font-size: 11px; color: #9CA3AF;">This digest was generated based on your preferences. <br> <strong>Demo Mode:</strong> Daily 9AM trigger simulated manually.</p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function bindDigestEvents(container) {
  if (!container) return;

  // Generate Button
  var btnGen = container.querySelector('.jnt-btn-generate-digest');
  if (btnGen) {
    btnGen.addEventListener('click', function () {
      var jobs = typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : [];
      var prefs = getPreferences();
      var digest = generateDigest(jobs, prefs);

      if (digest.length > 0) {
        var today = new Date().toISOString().split('T')[0];
        saveDigest(today, digest);
        handleRoute(); // Refresh view
      } else {
        alert('No matching jobs found to generate a digest. Try adjusting your preferences.');
      }
    });
  }

  // Copy Button
  var btnCopy = container.querySelector('.jnt-btn-copy-digest');
  if (btnCopy) {
    btnCopy.addEventListener('click', function () {
      var today = new Date().toISOString().split('T')[0];
      var digest = getDigest(today);
      if (digest) {
        var text = formatDigestText(digest);
        navigator.clipboard.writeText(text).then(function () {
          alert('Digest copied to clipboard!');
        }, function () {
          alert('Failed to copy. Please manually copy the text.');
        });
      }
    });
  }

  // Update Email Link
  var btnEmail = container.querySelector('.jnt-btn-email-digest');
  if (btnEmail) {
    var today = new Date().toISOString().split('T')[0];
    var digest = getDigest(today);
    if (digest) {
      var body = encodeURIComponent(formatDigestText(digest));
      btnEmail.href = 'mailto:?subject=My%209AM%20Job%20Digest&body=' + body;
    }
  }
}

function renderProof() {
  var steps = getStepCompletionStatus();
  var links = getProofLinks();
  var allPassed = areAllTestsPassed() && areAllLinksProvided();

  // Status Badge Logic: Not Started, In Progress, Shipped
  var checklist = getChecklist();
  var testsChecked = 0;
  JNT_TEST_ITEMS.forEach(function (t) { if (checklist[t.id]) testsChecked++; });
  var hasStarted = testsChecked > 0 || areAllLinksProvided() || steps.some(function (s) { return s.id > 1 && s.completed; });

  var statusBadge = '';
  if (allPassed) statusBadge = '<span class="jnt-status-badge--shipped">Shipped</span>';
  else if (hasStarted) statusBadge = '<span class="jnt-status-badge--progress">In Progress</span>';
  else statusBadge = '<span class="jnt-status-badge--neutral">Not Started</span>';

  var stepsHtml = steps.map(function (s) {
    var cls = s.completed ? 'is-completed' : '';
    var statusText = s.completed ? 'Completed' : 'Pending';
    return '<div class="jnt-step-item ' + cls + '">' +
      '<div class="jnt-step-icon"></div>' +
      '<span>' + s.text + ' — <strong>' + statusText + '</strong></span>' +
      '</div>';
  }).join('');

  var completionBanner = allPassed ? '<div class="jnt-completion-banner">Project 1 Shipped Successfully.</div>' : '';

  return '<div class="jnt-proof">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">' +
    '<div>' +
    '<h1 class="jnt-heading" style="margin:0;">Project 1 — Job Notification Tracker</h1>' +
    '<p class="jnt-subtext" style="margin:0;">Final Submission & Proof Dashboard</p>' +
    '</div>' +
    statusBadge +
    '</div>' +

    completionBanner +

    '<div class="jnt-proof-section">' +
    '<h2 class="jnt-heading" style="font-size: 1.25rem; margin-bottom: 16px;">A) Step Completion Summary</h2>' +
    '<div class="jnt-step-grid">' + stepsHtml + '</div>' +
    '</div>' +

    '<div class="jnt-proof-section">' +
    '<h2 class="jnt-heading" style="font-size: 1.25rem; margin-bottom: 16px;">B) Artifact Collection Inputs</h2>' +
    '<div class="kn-card jnt-proof-form">' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Lovable Project Link</label>' +
    '<input type="url" id="jnt-link-lovable" class="kn-input" placeholder="https://lovable.dev/projects/..." value="' + escapeHtml(links.lovable) + '">' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">GitHub Repository Link</label>' +
    '<input type="url" id="jnt-link-github" class="kn-input" placeholder="https://github.com/user/repo" value="' + escapeHtml(links.github) + '">' +
    '</div>' +
    '<div class="jnt-field">' +
    '<label class="jnt-field__label">Deployed URL (Vercel or equivalent)</label>' +
    '<input type="url" id="jnt-link-deploy" class="kn-input" placeholder="https://your-app.vercel.app" value="' + escapeHtml(links.deploy) + '">' +
    '</div>' +
    '<div style="margin-top: 24px; display:flex; gap: 12px;">' +
    '<button type="button" class="kn-btn kn-btn--primary jnt-btn-save-proof">Save Artifacts</button>' +
    '<button type="button" class="kn-btn kn-btn--secondary jnt-btn-copy-submission">Copy Final Submission</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function bindProofEvents(container) {
  if (!container) return;

  var saveBtn = container.querySelector('.jnt-btn-save-proof');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var links = {
        lovable: container.querySelector('#jnt-link-lovable').value.trim(),
        github: container.querySelector('#jnt-link-github').value.trim(),
        deploy: container.querySelector('#jnt-link-deploy').value.trim()
      };

      // Simple validation
      var valid = true;
      for (var k in links) {
        if (links[k] && !links[k].startsWith('http')) {
          valid = false; alert('Please enter valid URLs starting with http/https'); break;
        }
      }

      if (valid) {
        saveProofLinks(links);
        showToast('Artifact links saved successfully.');
        handleRoute(); // Refresh UI to update status
      }
    });
  }

  var copyBtn = container.querySelector('.jnt-btn-copy-submission');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var links = getProofLinks();
      if (!links.lovable || !links.github || !links.deploy) {
        alert('Please provide all 3 links before copying the final submission.');
        return;
      }

      '------------------------------------------\n' +
        'Job Notification Tracker — Final Submission\n\n' +
        'Lovable Project:\n' + links.lovable + '\n\n' +
        'GitHub Repository:\n' + links.github + '\n\n' +
        'Live Deployment:\n' + links.deploy + '\n\n' +
        'Core Features:\n' +
        '- Intelligent match scoring\n' +
        '- Daily digest simulation\n' +
        '- Status tracking\n' +
        '- Test checklist enforced\n' +
        '------------------------------------------';

      navigator.clipboard.writeText(text).then(function () {
        showToast('Final submission copied to clipboard.');
      });
    });
  }
}

function renderTestChecklist() {
  var map = getChecklist();
  var passedCount = 0;
  JNT_TEST_ITEMS.forEach(function (item) { if (map[item.id]) passedCount++; });

  var listHtml = JNT_TEST_ITEMS.map(function (item) {
    var checked = map[item.id] ? 'checked' : '';
    return '<div class="jnt-test-item">' +
      '<label class="jnt-test-label">' +
      '<input type="checkbox" class="jnt-test-checkbox" data-id="' + item.id + '" ' + checked + '>' +
      '<span>' + item.text + '</span>' +
      '</label>' +
      '<div class="jnt-test-hint" title="' + escapeHtml(item.hint) + '">?</div>' +
      '</div>';
  }).join('');

  var warning = passedCount < 10 ? '<p class="jnt-test-warning">⚠️ Resolve all issues before shipping.</p>' : '<p class="jnt-test-success">✅ All tests passed. Ready to ship!</p>';
  var nextUrl = areAllLinksProvided() ? '#/jt/08-ship' : '#/jt/proof';
  var nextLabel = areAllLinksProvided() ? 'Go to Shipment Page &rarr;' : 'Go to Proof Page &rarr;';
  var shipLink = passedCount === 10 ? '<a href="' + nextUrl + '" class="kn-btn kn-btn--primary" style="margin-top: 24px; display:inline-block;">' + nextLabel + '</a>' : '<button class="kn-btn kn-btn--secondary" disabled style="margin-top: 24px; opacity: 0.5; cursor: not-allowed;">Shipment Locked</button>';

  return '<div class="jnt-test-checklist">' +
    '<h1 class="jnt-heading">Test Checklist</h1>' +
    '<p class="jnt-subtext">Self-verify your local build before deployment.</p>' +
    '<div class="kn-card">' +
    '<div class="jnt-test-header">' +
    '<div class="jnt-test-summary">Tests Passed: ' + passedCount + ' / 10</div>' +
    warning +
    '</div>' +
    '<div class="jnt-test-list">' + listHtml + '</div>' +
    '<div class="jnt-test-footer" style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; display:flex; justify-content: space-between; align-items:center;">' +
    '<button type="button" class="kn-btn kn-btn--secondary jnt-btn-reset-tests">Reset Test Status</button>' +
    shipLink +
    '</div>' +
    '</div>' +
    '</div>';
}

function bindTestEvents(container) {
  if (!container) return;

  container.querySelectorAll('.jnt-test-checkbox').forEach(function (el) {
    el.addEventListener('change', function () {
      var map = getChecklist();
      map[this.getAttribute('data-id')] = this.checked;
      saveChecklist(map);
      handleRoute(); // Refresh UI
    });
  });

  var resetBtn = container.querySelector('.jnt-btn-reset-tests');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to reset all test results?')) {
        saveChecklist({});
        handleRoute();
      }
    });
  }
}

function renderShipPage() {
  return '<div class="jnt-ship-page" style="text-align:center; padding: 64px 24px;">' +
    '<div style="font-size: 64px; margin-bottom: 24px;">🚢</div>' +
    '<h1 class="jnt-heading">Shipment Ready</h1>' +
    '<p class="jnt-subtext">All quality gates passed. Your Job Notification Tracker is ready for production.</p>' +
    '<div class="kn-card" style="max-width: 400px; margin: 32px auto; padding: 24px;">' +
    '<p style="margin-bottom: 16px; color: #666;">This build has been verified against the 10-point checklist.</p>' +
    '<a href="#/" class="kn-btn kn-btn--primary">Return to Dashboard</a>' +
    '</div>' +
    '</div>';
}

function renderPage(path) {
  var route = JNT_ROUTES[path] || JNT_ROUTES['/'];
  var container = document.getElementById('jnt-page');
  if (!container) return;

  var html = '';
  switch (path) {
    case '/': html = renderLanding(); break;
    case '/settings': html = renderSettings(); break;
    case '/dashboard': html = renderDashboard(); break;
    case '/saved': html = renderSaved(); break;
    case '/digest': html = renderDigest(); break;
    case '/proof': html = renderProof(); break;
    case '/jt/proof': html = renderProof(); break;
    case '/jt/07-test': html = renderTestChecklist(); break;
    case '/jt/08-ship':
      if (!areAllTestsPassed()) {
        window.location.hash = '#/jt/07-test';
        return;
      }
      if (!areAllLinksProvided()) {
        window.location.hash = '#/jt/proof';
        return;
      }
      html = renderShipPage();
      break;
    default: html = renderLanding();
  }

  container.innerHTML = html;
  container.classList.toggle('jnt-page--wide', path === '/dashboard' || path === '/saved');
  document.title = route.title + ' — Job Notification Tracker';

  if (path === '/dashboard') {
    var jobs = typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : [];
    // Bind dashboard actions (View/Save/Status) once
    bindDashboardEvents(container, jobs);

    bindFilterEvents(container.querySelector('.jnt-filter-wrap'), jobs, function () {
      container.classList.add('jnt-dashboard');
      var grid = document.getElementById('jnt-job-grid');
      if (grid) {
        var prefs = getPreferences();
        var scoredJobs = jobs.map(function (j) {
          var j2 = {}; for (var k in j) j2[k] = j[k];
          j2.score = calculateMatchScore(j, prefs);
          return j2;
        });

        var filters = getCurrentFilters();
        var filtered = filterAndSortJobs(scoredJobs, filters, prefs);
        var cardsHtml = filtered.map(function (j) { return renderJobCard(j, false); }).join('');

        var emptyHtml = '<div class="kn-empty jnt-empty"><p class="kn-empty__title">No jobs match your filters.</p><p class="kn-empty__hint">Try adjusting filters or search keyword.</p></div>';
        if (filtered.length === 0 && filters.showMatchesOnly) {
          emptyHtml = '<div class="kn-empty kn-empty--premium"><p class="kn-empty__title">No roles match your criteria</p><p class="kn-empty__hint">Try lowering your match threshold in settings or adjusting your filters.</p></div>';
        }

        grid.innerHTML = filtered.length ? cardsHtml : emptyHtml;
      }
    });
  } else if (path === '/saved') {
    bindDashboardEvents(container, typeof JNT_JOBS !== 'undefined' ? JNT_JOBS : []);
  } else if (path === '/digest') {
    bindDigestEvents(container);
  } else if (path === '/settings') {
    bindSettingsEvents(container);
  } else if (path === '/jt/07-test') {
    bindTestEvents(container);
  } else if (path === '/proof' || path === '/jt/proof') {
    bindProofEvents(container);
  }
}

function setActiveLink(path) {
  var links = document.querySelectorAll('.jnt-nav__link');
  links.forEach(function (link) {
    var href = link.getAttribute('href').slice(1) || '/';
    link.classList.toggle('is-active', href === path);
  });
}

function handleRoute() {
  var path = getPath();
  renderPage(path);
  setActiveLink(path);
}

function initHamburger() {
  var btn = document.querySelector('.jnt-hamburger');
  var nav = document.querySelector('.jnt-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });

  nav.querySelectorAll('.jnt-nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

function initModal() {
  var modal = document.getElementById('jnt-modal');
  if (!modal) return;
  modal.querySelector('.jnt-modal__backdrop').addEventListener('click', hideModal);
  modal.querySelector('.jnt-modal__close').addEventListener('click', hideModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideModal();
  });
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', function () {
  handleRoute();
  initHamburger();
  initModal();
});
