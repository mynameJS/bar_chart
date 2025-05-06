// DOM 셀렉터 함수
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// DOM 요소 생성 함수 - 태그, 속성 객체 생성 및 적용
const createEl = (tag, props = {}) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    el[key] = value;
  }
  return el;
};

// 초기 데이터
let data = [
  { id: 'a', value: 75 },
  { id: 'b', value: 20 },
  { id: 'c', value: 80 },
  { id: 'd', value: 100 },
  { id: 'e', value: 70 },
];

// 테이블 수정용으로 사용되는 데이터 복사본
let editingData = structuredClone(data);

// JSON 복원 기능을 위한 원본 백업값
let previousJson = JSON.stringify(data, null, 2);

// 데이터 갱신 함수 - 백업값 저장 후 새로운 데이터로 업데이트 및 렌더링
const updateData = newData => {
  previousJson = JSON.stringify(data, null, 2); // 현재 데이터를 백업
  data = structuredClone(newData); // 새 데이터를 반영
  renderAll();
};

// Y축 눈금 계산 함수 (0, 중간값, 최대값 반환)
const getTicks = max => {
  const mid = Math.round(max / 2);
  return [0, mid, max];
};

// 막대그래프 영역 렌더링
const renderBarChart = () => {
  const barsBox = $('.bars');
  barsBox.innerHTML = '';

  const maxVal = Math.max(...data.map(d => d.value), 1); // 최대값 계산
  const yTicks = getTicks(maxVal); // 눈금값 리스트

  // 눈금 추가
  yTicks.forEach(val => {
    const tick = createEl('div', {
      className: 'y-tick',
      textContent: val,
    });
    tick.style.bottom = `${(val / maxVal) * 90}%`;
    barsBox.appendChild(tick);
  });

  // 막대 및 라벨 추가
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
    tr.appendChild(createEl('td', { textContent: item.id }));

    const valTd = createEl('td');
    const valInput = createEl('input', {
      value: item.value,
      type: 'number',
      min: '0',
      required: true,
    });

    // 입력값 유효성 검사
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
      renderTable(); // 전체 적용 전 테이블만 동기화
    };
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);

    tbody.appendChild(tr);
  });

  // Apply 버튼 동작
  $('#apply-table').onclick = () => {
    // 전체 valInput 의 type(number), min(0) 유효성 검사
    const invalid = [...$$('#data-table-body input')].some(input => !input.checkValidity());
    if (invalid) {
      alert('입력값 중 유효하지 않은 값이 있습니다. 0 이상의 숫자만 입력해주세요.');
      return;
    }
    updateData(structuredClone(editingData)); // 편집데이터를 원본데이터로 업데이트
  };
};

// 값 추가 폼 세팅
const setupAddForm = () => {
  $('#add-form').onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const value = parseInt(formData.get('value'), 10);

    // 중복 ID 체크
    if (data.some(d => d.id === id)) {
      alert(`ID "${id}"는 이미 존재합니다.`);
      return;
    }

    // 입력값 체크
    if (isNaN(value) || value < 0) {
      alert('값은 숫자만 입력해주세요 (0 이상).');
      return;
    }

    updateData([...data, { id, value }]); // 데이터 업데이트
    e.target.reset();
  };
};

// JSON 텍스트 박스 내용 동기화
const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2);
};

// JSON 유효성 검사 함수
const validateJsonData = jsonStr => {
  const errors = [];
  let parsed;

  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    errors.push(
      'JSON 문법 오류입니다. 다음 사항을 확인하세요:\n' +
        '• 쉼표 누락 여부 (각 항목 끝에 , 필수)\n' +
        '• 중괄호({})와 대괄호([])의 짝이 맞는지\n' +
        '• 문자열은 반드시 "쌍따옴표"로 감싸야 함\n' +
        '• 마지막 항목 뒤에 쉼표(,)를 넣지 말 것'
    );
    return { valid: false, errors };
  }

  if (!Array.isArray(parsed)) {
    errors.push('배열 형태가 아닙니다. [ ] 안에 객체들을 넣어주세요.');
    return { valid: false, errors };
  }

  // parse 후 각 항목 유효성 검사
  parsed.forEach((item, i) => {
    const keys = Object.keys(item);
    const allowedKeys = ['id', 'value'];

    if (!('id' in item)) {
      errors.push(`${i + 1}번째 항목에 id가 누락되었습니다.`);
    }
    if (!('value' in item)) {
      errors.push(`${i + 1}번째 항목에 value가 누락되었습니다.`);
    }

    const extraKeys = keys.filter(key => !allowedKeys.includes(key));
    if (extraKeys.length > 0) {
      errors.push(`${i + 1}번째 항목에 불필요한 속성이 있습니다: ${extraKeys.join(', ')}`);
    }

    if ('id' in item && typeof item.id !== 'string') {
      errors.push(`${i + 1}번째 항목의 id는 문자열이어야 합니다.`);
    }
    if ('value' in item && typeof item.value !== 'number') {
      errors.push(`${i + 1}번째 항목의 value는 숫자여야 합니다.`);
    }
  });

  return errors.length ? { valid: false, errors } : { valid: true, parsed };
};

// JSON 고급 편집 폼 세팅
const setupJsonForm = () => {
  const jsonForm = $('#json-form');
  const jsonTextarea = $('#json-form textarea');
  const errorBox = $('#json-errors');

  // Apply 버튼 동작
  jsonForm.onsubmit = e => {
    e.preventDefault();
    const rawInput = jsonTextarea.value;
    const result = validateJsonData(rawInput);

    if (!result.valid) {
      errorBox.innerHTML = result.errors.map(msg => `• ${msg}`).join('<br>'); // 에러메세지 출력
      errorBox.classList.add('visible'); // 에러박스 출현
      return;
    }

    errorBox.classList.remove('visible'); // 유효성 검사 통과 시 에러박스 숨김
    updateData(result.parsed); // 데이터 업데이트
  };

  // 자동 들여쓰기
  $('#format-json').onclick = () => {
    try {
      const parsed = JSON.parse(jsonTextarea.value);
      jsonTextarea.value = JSON.stringify(parsed, null, 2);
      errorBox.classList.remove('visible');
    } catch {
      errorBox.textContent = '자동 들여쓰기에 실패했습니다. JSON 문법을 확인해주세요.';
      errorBox.classList.add('visible');
    }
  };

  // 복원 기능
  $('#restore-json').onclick = () => {
    jsonTextarea.value = previousJson;
    errorBox.classList.remove('visible');
  };
};

// 전체 렌더링 함수
const renderAll = () => {
  editingData = structuredClone(data);
  renderBarChart();
  renderTable();
  renderTextarea();
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  setupJsonForm();
  renderAll();
});
