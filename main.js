const $ = sel => document.querySelector(sel);
const createEl = (tag, className = '', text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
};

const data = [
  { id: 0, value: 75 },
  { id: 1, value: 20 },
  { id: 2, value: 80 },
  { id: 3, value: 100 },
  { id: 4, value: 70 },
];

const getTicks = max => {
  const mid = Math.round(max / 2);
  return [0, mid, max];
};

const renderBarChart = () => {
  const barsBox = $('.bars');
  barsBox.innerHTML = '';

  const max = Math.max(...data.map(d => d.value), 1);
  const yTicks = getTicks(max);

  // Y축 눈금
  yTicks.forEach(val => {
    const tick = createEl('div', 'y-tick', val);
    tick.style.bottom = `${(val / max) * 90}%`;
    barsBox.appendChild(tick);
  });

  // 바 그리기
  data.forEach((item, i) => {
    const bar = createEl('div', 'bar');
    bar.style.left = `${((i + 1) / (data.length + 1)) * 100}%`;
    bar.style.height = `${(item.value / max) * 90}%`;

    // 값 표시
    const valueLabel = createEl('div', 'bar-value', item.value);
    bar.appendChild(valueLabel);

    // ID 라벨
    const label = createEl('div', 'bar-label', item.id);
    bar.appendChild(label);

    barsBox.appendChild(bar);
  });
};

const renderTable = () => {
  const tbody = $('#data-table-body');
  tbody.innerHTML = '';
  data.forEach((item, i) => {
    const tr = createEl('tr');
    tr.appendChild(createEl('td', '', item.id));
    const valTd = createEl('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = item.value;
    input.oninput = e => {
      data[i].value = parseInt(e.target.value, 10) || 0;
    };
    valTd.appendChild(input);
    tr.appendChild(valTd);
    const delTd = createEl('td');
    const delBtn = createEl('button', '', '삭제');
    delBtn.onclick = () => {
      data.splice(i, 1);
      renderAll();
    };
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);
    tbody.appendChild(tr);
  });
  $('#apply-table').onclick = () => renderAll();
};

const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2);
};

const setupAddForm = () => {
  $('#add-form').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get('id');
    const value = parseInt(fd.get('value'), 10);
    if (data.some(d => d.id == id)) {
      alert(`ID "${id}"는 이미 존재합니다.`);
      return;
    }
    if (isNaN(value)) {
      alert('숫자를 입력해주세요');
      return;
    }
    data.push({ id, value });
    e.target.reset();
    renderAll();
  };
};

$('#json-form').onsubmit = e => {
  e.preventDefault();
  try {
    const parsed = JSON.parse(e.target.json.value);
    if (!Array.isArray(parsed)) throw new Error();
    data = parsed;
    renderAll();
  } catch {
    alert('올바른 JSON 형식이 아닙니다.');
  }
};

const renderAll = () => {
  renderBarChart();
  renderTable();
  renderTextarea();
};

document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  renderAll();
});
