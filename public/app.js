const TOKEN_KEY = 'couple_schedule_token';

const $ = (sel) => document.querySelector(sel);

function toast(msg, isError) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('error', Boolean(isError));
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    ...options,
    headers,
    body:
      options.body instanceof FormData || typeof options.body === 'string'
        ? options.body
        : options.body != null
          ? JSON.stringify(options.body)
          : undefined,
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const msg = data.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

function setAuthed(authed) {
  $('#auth-panel').classList.toggle('hidden', authed);
  $('#app-panel').classList.toggle('hidden', !authed);
  $('#user-bar').classList.toggle('hidden', !authed);
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  $('#form-login').classList.toggle('hidden', name !== 'login');
  $('#form-register').classList.toggle('hidden', name !== 'register');
}

async function loadMe() {
  const { user } = await api('/api/auth/me');
  $('#user-label').textContent = `${user.name} (${user.email})`;
  return user;
}

async function refreshCouple() {
  const box = $('#couple-status');
  try {
    const { couple } = await api('/api/couples/me');
    if (!couple) {
      box.textContent = '아직 커플에 연결되지 않았습니다. 초대를 만들거나 코드로 참여하세요.';
      $('#invite-box').classList.add('hidden');
      return { couple: null, active: false };
    }
    const st = couple.status;
    const u1 = couple.user1?.name || couple.user1?.email || '?';
    const u2 = couple.user2 ? couple.user2?.name || couple.user2?.email : '(대기 중)';
    box.textContent =
      st === 'active'
        ? `연결됨 · ${u1} ↔ ${u2}`
        : `초대 대기 중 · 생성자: ${u1} · 상대 참여 대기`;
    if (st === 'pending' && couple.inviteCode) {
      $('#invite-code').textContent = couple.inviteCode;
      $('#invite-box').classList.remove('hidden');
    } else {
      $('#invite-box').classList.add('hidden');
    }
    return { couple, active: st === 'active' };
  } catch (e) {
    box.textContent = e.message;
    return { couple: null, active: false };
  }
}

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromLocalInputValue(v) {
  return new Date(v).toISOString();
}

function resetScheduleForm() {
  const f = $('#form-schedule');
  f.reset();
  f.querySelector('[name="id"]').value = '';
  $('#btn-schedule-submit').textContent = '일정 추가';
  $('#btn-schedule-cancel').classList.add('hidden');
}

async function refreshSchedules(active) {
  const ul = $('#schedule-list');
  ul.innerHTML = '';
  if (!active) {
    ul.innerHTML = '<li class="muted">커플이 활성화된 뒤 일정을 불러옵니다.</li>';
    $('#form-schedule').querySelectorAll('input,textarea,button').forEach((el) => {
      if (el.type === 'hidden') return;
      el.disabled = true;
    });
    return;
  }
  $('#form-schedule').querySelectorAll('input,textarea,button').forEach((el) => {
    el.disabled = false;
  });

  const { schedules } = await api('/api/schedules');
  if (!schedules.length) {
    ul.innerHTML = '<li class="muted">등록된 일정이 없습니다.</li>';
    return;
  }
  for (const s of schedules) {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(s.title)}</strong>
      <div class="schedule-meta">${escapeHtml(s.description || '')}</div>
      <div class="schedule-meta">${formatRange(s.startAt, s.endAt)}</div>`;
    const actions = document.createElement('div');
    actions.className = 'schedule-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn ghost';
    edit.textContent = '수정';
    edit.addEventListener('click', () => {
      const f = $('#form-schedule');
      f.querySelector('[name="id"]').value = s._id;
      f.querySelector('[name="title"]').value = s.title;
      f.querySelector('[name="description"]').value = s.description || '';
      f.querySelector('[name="startAt"]').value = toLocalInputValue(s.startAt);
      f.querySelector('[name="endAt"]').value = toLocalInputValue(s.endAt);
      $('#btn-schedule-submit').textContent = '일정 저장';
      $('#btn-schedule-cancel').classList.remove('hidden');
      f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn danger';
    del.textContent = '삭제';
    del.addEventListener('click', async () => {
      if (!confirm('이 일정을 삭제할까요?')) return;
      try {
        await api(`/api/schedules/${s._id}`, { method: 'DELETE' });
        toast('삭제했습니다.');
        await refreshSchedules(true);
      } catch (err) {
        toast(err.message, true);
      }
    });
    actions.append(edit, del);
    li.append(left, actions);
    ul.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRange(startAt, endAt) {
  const a = new Date(startAt);
  const b = new Date(endAt);
  const opt = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return `${a.toLocaleString('ko-KR', opt)} → ${b.toLocaleString('ko-KR', opt)}`;
}

async function bootApp() {
  setAuthed(true);
  await loadMe();
  const { active } = await refreshCouple();
  await refreshSchedules(active);
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email: fd.get('email'), password: fd.get('password') },
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    toast('로그인되었습니다.');
    await bootApp();
  } catch (err) {
    toast(err.message, true);
  }
});

$('#form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email: fd.get('email'),
        password: fd.get('password'),
        name: fd.get('name'),
      },
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    toast('가입되었습니다.');
    await bootApp();
  } catch (err) {
    toast(err.message, true);
  }
});

$('#btn-logout').addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  resetScheduleForm();
  setAuthed(false);
  toast('로그아웃했습니다.');
});

$('#btn-invite').addEventListener('click', async () => {
  try {
    const data = await api('/api/couples/invite', { method: 'POST' });
    toast(data.message || '초대 코드를 발급했습니다.');
    const { active } = await refreshCouple();
    await refreshSchedules(active);
    if (data.inviteCode) {
      $('#invite-code').textContent = data.inviteCode;
      $('#invite-box').classList.remove('hidden');
    }
  } catch (err) {
    toast(err.message, true);
  }
});

$('#form-join').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const code = String(fd.get('inviteCode') || '').trim();
  if (!code) return;
  try {
    await api('/api/couples/join', { method: 'POST', body: { inviteCode: code } });
    e.target.reset();
    toast('커플에 참여했습니다.');
    const { active } = await refreshCouple();
    await refreshSchedules(active);
  } catch (err) {
    toast(err.message, true);
  }
});

$('#form-schedule').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = fd.get('id');
  const body = {
    title: fd.get('title'),
    description: fd.get('description') || '',
    startAt: fromLocalInputValue(String(fd.get('startAt'))),
    endAt: fromLocalInputValue(String(fd.get('endAt'))),
  };
  try {
    if (id) {
      await api(`/api/schedules/${id}`, { method: 'PATCH', body });
      toast('일정을 수정했습니다.');
    } else {
      await api('/api/schedules', { method: 'POST', body });
      toast('일정을 추가했습니다.');
    }
    resetScheduleForm();
    const { active } = await refreshCouple();
    await refreshSchedules(active);
  } catch (err) {
    toast(err.message, true);
  }
});

$('#btn-schedule-cancel').addEventListener('click', () => {
  resetScheduleForm();
});

(async function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    setAuthed(false);
    return;
  }
  try {
    await bootApp();
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
    toast('세션이 만료되었습니다. 다시 로그인하세요.', true);
  }
})();
