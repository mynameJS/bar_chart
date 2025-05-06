const $ = sel => document.querySelector(sel);
const createEl = (tag, className = '', text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
};

let data = [
  { id: 'a', value: 75 },
  { id: 'b', value: 20 },
  { id: 'c', value: 80 },
  { id: 'd', value: 100 },
  { id: 'e', value: 70 },
];

let editingData = structuredClone(data); // 편집용 복사본

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
  editingData.forEach((item, i) => {
    const tr = createEl('tr');
    tr.appendChild(createEl('td', '', item.id));

    const valTd = createEl('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = item.value;
    input.oninput = e => {
      editingData[i].value = parseInt(e.target.value, 10) || 0;
    };
    valTd.appendChild(input);
    tr.appendChild(valTd);

    const delTd = createEl('td');
    const delBtn = createEl('button', '', '삭제');
    delBtn.onclick = () => {
      editingData.splice(i, 1);
      renderTable(); // 테이블만 다시 렌더링
    };
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);

    tbody.appendChild(tr);
  });

  $('#apply-table').onclick = () => {
    data = structuredClone(editingData); // apply 시 반영
    renderAll();
  };
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

const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2); // 휴먼에러 방지 하나 넣어야댐
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
  editingData = structuredClone(data); // 원본 기준 복사
  renderBarChart();
  renderTable();
  renderTextarea();
};

document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  renderAll();
});
