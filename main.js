// DOM 셀렉터
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// DOM 요소 생성 (모든 속성은 props 안에서 처리)
const createEl = (tag, props = {}) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    el[key] = value;
  }
  return el;
};

// 원본 데이터
let data = [
  { id: 'a', value: 75 },
  { id: 'b', value: 20 },
  { id: 'c', value: 80 },
  { id: 'd', value: 100 },
  { id: 'e', value: 70 },
];

// 테이블 편집용 데이터 복사본
let editingData = structuredClone(data);

// Y축 눈금 계산 함수 (0, 중간, 최대)
const getTicks = max => {
  const mid = Math.round(max / 2);
  return [0, mid, max];
};

// 그래프 영역 렌더링
const renderBarChart = () => {
  const barsBox = $('.bars');
  barsBox.innerHTML = '';

  const maxVal = Math.max(...data.map(d => d.value), 1); // 최대값
  const yTicks = getTicks(maxVal); // 눈금 리스트

  // Y축 눈금 라벨
  yTicks.forEach(val => {
    const tick = createEl('div', {
      className: 'y-tick',
      textContent: val,
    });
    tick.style.bottom = `${(val / maxVal) * 90}%`;
    barsBox.appendChild(tick);
  });

  // 막대 그래프
  data.forEach((item, i) => {
    const bar = createEl('div', { className: 'bar' });
    bar.style.left = `${((i + 1) / (data.length + 1)) * 100}%`;
    bar.style.height = `${(item.value / maxVal) * 90}%`;

    const valueLabel = createEl('div', {
      className: 'bar-value',
      textContent: item.value,
    });
    bar.appendChild(valueLabel);

    const label = createEl('div', {
      className: 'bar-label',
      textContent: item.id,
    });
    bar.appendChild(label);

    barsBox.appendChild(bar);
  });
};

// 테이블 렌더링 (편집용)
const renderTable = () => {
  const tbody = $('#data-table-body');
  tbody.innerHTML = '';

  editingData.forEach((item, i) => {
    const tr = createEl('tr');

    // ID 셀
    tr.appendChild(createEl('td', { textContent: item.id }));

    // 값 셀
    const valTd = createEl('td');
    const valInput = createEl('input', {
      value: item.value,
      type: 'number',
      min: '0',
      required: true,
    });

    valInput.addEventListener('blur', e => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 0) {
        e.target.setCustomValidity('0 이상의 숫자를 입력해주세요');
      } else {
        e.target.setCustomValidity('');
        editingData[i].value = val;
      }
      e.target.reportValidity();
    });

    valTd.appendChild(valInput);
    tr.appendChild(valTd);

    // 삭제 버튼
    const delTd = createEl('td');
    const delBtn = createEl('button', { textContent: '삭제' });
    delBtn.onclick = () => {
      editingData.splice(i, 1);
      renderTable(); // Apply 누르기 전 Table 만 업데이트
    };
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);

    tbody.appendChild(tr);
  });

  $('#apply-table').onclick = () => {
    const invalid = [...$$('#data-table-body input')].some(input => !input.checkValidity());
    if (invalid) {
      alert('입력값 중 유효하지 않은 값이 있습니다. 0 이상의 숫자만 입력해주세요.');
      return;
    }
    data = structuredClone(editingData);
    renderAll();
  };
};

// 값 추가 폼 세팅
const setupAddForm = () => {
  $('#add-form').onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const value = parseInt(formData.get('value'), 10);

    if (data.some(d => d.id === id)) {
      alert(`ID "${id}"는 이미 존재합니다.`);
      return;
    }

    if (isNaN(value) || value < 0) {
      alert('값은 숫자만 입력해주세요 (0 이상).');
      return;
    }

    data.push({ id, value });
    e.target.reset();
    renderAll();
  };
};

// JSON textarea에 데이터 출력
const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2);
};

// JSON textarea로부터 값 반영
$('#json-form').onsubmit = e => {
  e.preventDefault();
  try {
    const parsed = JSON.parse(e.target.json.value);
    if (!Array.isArray(parsed)) throw new Error();
    if (!parsed.every(item => typeof item.id === 'string' && typeof item.value === 'number')) {
      throw new Error();
    }

    data = parsed;
    renderAll();
  } catch {
    alert('올바른 JSON 형식이 아니거나 데이터 형식이 잘못되었습니다.');
  }
};

// 전체 렌더링: 그래프, 테이블, JSON
const renderAll = () => {
  editingData = structuredClone(data);
  renderBarChart();
  renderTable();
  renderTextarea();
};

// 페이지 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  renderAll();
});
