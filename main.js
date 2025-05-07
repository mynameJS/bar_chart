// DOM 셀렉터 함수
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// DOM 요소 생성 함수 - 태그와 속성(object)을 받아 요소 생성
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

// JSON 복원 기능을 위한 백업 데이터
let previousJson = JSON.stringify(data, null, 2);

// 데이터 업데이트 함수 - 백업 후 data 교체 및 전체 렌더링
const updateData = newData => {
  previousJson = JSON.stringify(data, null, 2);
  data = structuredClone(newData);
  renderAll();
};

// Y축 눈금 계산 함수 - [0, 중간값, 최대값] 반환
const getTicks = max => {
  const mid = Math.round(max / 2);
  return Array.from(new Set([0, mid, max])); // 중복제거 ex) max = 1
};

// 막대그래프 전체 렌더링
const renderBarChart = () => {
  const barsBox = $('.bars');
  barsBox.innerHTML = '';

  const maxVal = Math.max(...data.map(d => d.value), 1); // 최대값 (최소 1)
  const yTicks = getTicks(maxVal);

  // Y축 눈금 표시
  yTicks.forEach(val => {
    const tick = createEl('div', {
      className: 'y-tick',
      textContent: val,
    });
    tick.style.bottom = `${(val / maxVal) * 90}%`;
    barsBox.appendChild(tick);
  });

  // 각 데이터에 대응하는 막대 및 라벨 추가
  data.forEach((item, i) => {
    const bar = createEl('div', { className: 'bar' });
    bar.style.left = `${((i + 1) / (data.length + 1)) * 100}%`;
    bar.style.height = `${(item.value / maxVal) * 90}%`;

    const valueLabel = createEl('div', {
      className: 'bar-value',
      textContent: item.value,
    });
    const idLabel = createEl('div', {
      className: 'bar-label',
      textContent: item.id,
    });

    bar.appendChild(valueLabel);
    bar.appendChild(idLabel);
    barsBox.appendChild(bar);
  });
};

// 테이블 렌더링 - data 복사본 기반으로 편집용 UI 구성
const renderTable = (editingData = structuredClone(data)) => {
  const tbody = $('#data-table-body');
  tbody.innerHTML = '';

  editingData.forEach((item, i) => {
    const tr = createEl('tr');

    const idCell = createEl('td', { textContent: item.id });
    const valCell = createEl('td');
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

    valCell.appendChild(valInput);
    tr.appendChild(idCell);
    tr.appendChild(valCell);

    const delCell = createEl('td');
    const delBtn = createEl('button', { textContent: '삭제' });
    delBtn.onclick = () => {
      editingData.splice(i, 1);
      renderTable(editingData); // 전체 적용 전 테이블 내에서만 동기화
    };
    delCell.appendChild(delBtn);
    tr.appendChild(delCell);

    tbody.appendChild(tr);
  });

  const applyBtn = $('#apply-table');
  applyBtn.onclick = () => {
    // 값 리스트 유효성 검사 | type(number), min(0)
    const invalid = [...$$('#data-table-body input')].some(input => !input.checkValidity());
    if (invalid) {
      alert('입력값 중 유효하지 않은 값이 있습니다. 0 이상의 숫자만 입력해주세요.');
      return;
    }
    updateData(structuredClone(editingData));
  };
};

// 값 추가 폼
const setupAddForm = () => {
  const form = $('#add-form');
  form.onsubmit = e => {
    e.preventDefault();

    const formData = new FormData(form);
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

    updateData([...data, { id, value }]);
    form.reset();
  };
};

// 값 고급 편집 렌더링 - JSON 기반 데이터
const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2);
};

// JSON 유효성 검사 함수
const validateJsonData = jsonStr => {
  const errors = [];
  let parsed;

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    errors.push(
      'JSON 문법 오류입니다. 다음을 확인하세요:\n' +
        '• 쉼표 누락 여부\n' +
        '• 괄호( {, [, ] } ) 짝 오류\n' +
        '• 문자열은 반드시 "쌍따옴표"로 감쌀 것\n' +
        '• 마지막 항목 뒤에 쉼표 금지\n' +
        '• 각 객체는 "key: value" 쌍으로 구성되어야 함'
    );
    return { valid: false, errors };
  }

  if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'object' && !Array.isArray(item))) {
    errors.push('객체들의 1차원 배열만 허용됩니다. [[...]] 같은 중첩 배열은 사용할 수 없습니다.');
    return { valid: false, errors };
  }

  parsed.forEach((item, i) => {
    const keys = Object.keys(item);
    const allowed = ['id', 'value'];
    const extraKeys = keys.filter(k => !allowed.includes(k));

    if (!('id' in item)) {
      errors.push(`${i + 1}번째 항목에 id가 누락되었습니다.`);
    }
    if (!('value' in item)) {
      errors.push(`${i + 1}번째 항목에 value가 누락되었습니다.`);
    }
    if (extraKeys.length) {
      errors.push(`${i + 1}번째 항목에 불필요한 속성: ${extraKeys.join(', ')}`);
    }

    if ('id' in item) {
      if (typeof item.id !== 'string') {
        errors.push(`${i + 1}번째 항목의 id는 문자열이어야 합니다.`);
      } else if (item.id.trim() === '') {
        errors.push(`${i + 1}번째 항목의 id는 비어 있을 수 없습니다.`);
      }
    }

    if ('value' in item && typeof item.value !== 'number') {
      errors.push(`${i + 1}번째 항목의 value는 숫자여야 합니다.`);
    }
  });

  return errors.length ? { valid: false, errors } : { valid: true, parsed };
};

// JSON 편집 관련 UI 초기화 및 이벤트 등록
const setupJsonForm = () => {
  const form = $('#json-form');
  const textarea = form.querySelector('textarea');
  const errorBox = $('#json-errors');
  const formatBtn = $('#format-json');
  const restoreBtn = $('#restore-json');

  form.onsubmit = e => {
    e.preventDefault();
    const result = validateJsonData(textarea.value);

    if (!result.valid) {
      errorBox.innerHTML = result.errors.map(msg => `• ${msg}`).join('<br>');
      errorBox.classList.add('visible');
      return;
    }

    errorBox.classList.remove('visible');
    updateData(result.parsed);
  };

  formatBtn.onclick = () => {
    try {
      const parsed = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(parsed, null, 2);
      errorBox.classList.remove('visible');
    } catch {
      errorBox.textContent = '자동 들여쓰기에 실패했습니다. JSON 문법을 확인해주세요.';
      errorBox.classList.add('visible');
    }
  };

  restoreBtn.onclick = () => {
    textarea.value = previousJson;
    errorBox.classList.remove('visible');
  };
};

// 전체 화면 렌더링 함수
const renderAll = () => {
  renderBarChart();
  renderTable();
  renderTextarea();
};

// 초기 실행
document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  setupJsonForm();
  renderAll();
});
