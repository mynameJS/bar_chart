// 단일 요소 선택
const $ = selector => document.querySelector(selector);

// 여러 요소 선택
const $$ = selector => document.querySelectorAll(selector);

// 요소 생성
const createEl = (tag, className = '', text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
};

let initData;

const initJSONString = `
[
  {
    "id": 0,
    "value": 75
  },
  {
    "id": 1,
    "value": 20
  },
  {
    "id": 2,
    "value": 80
  },
  {
    "id": 3,
    "value": 100
  },
  {
    "id": 4,
    "value": 70
  }
]
`;

try {
  data = JSON.parse(initJSONString);
} catch (e) {
  alert('초기 데이터 파싱에 실패했습니다.');
  data = [];
}

const renderBarChart = () => {
  const container = $('.bar-chart');
  container.innerHTML = '';

  data.forEach(item => {
    const bar = createEl('div', 'bar');
    bar.style.height = `${item.value}px`;
    container.appendChild(bar);
  });
};

const renderTable = () => {
  const tbody = $('#data-table-body');
  tbody.innerHTML = ''; // 기존 초기화

  data.forEach((item, index) => {
    const tr = document.createElement('tr');

    // ID 셀 (수정 불가)
    const tdId = createEl('td', '', item.id);
    tdId.style.userSelect = 'none'; // 드래그 방지

    // 값 셀 (수정 가능 input)
    const tdValue = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = item.value;
    input.addEventListener('input', e => {
      data[index].value = parseInt(e.target.value, 10) || 0;
    });
    tdValue.appendChild(input);

    // 삭제 셀
    const tdDelete = document.createElement('td');
    const delBtn = createEl('button', '', '삭제');
    delBtn.addEventListener('click', () => {
      data.splice(index, 1);
      renderAll();
    });
    tdDelete.appendChild(delBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdValue);
    tr.appendChild(tdDelete);
    tbody.appendChild(tr);
  });

  // Apply 버튼 기능
  $('#apply-table').onclick = () => {
    renderAll(); // 입력값 반영 후 전체 재렌더
  };
};

const renderTextarea = () => {
  $('#json-form textarea').value = JSON.stringify(data, null, 2);
};

const setupAddForm = () => {
  const form = $('#add-form');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(form);
    const id = formData.get('id');
    const value = parseInt(formData.get('value'), 10);

    // 유효성 검사
    if (data.some(item => item.id == id)) {
      alert(`ID "${id}"는 이미 존재합니다.`);
      return;
    }

    if (isNaN(value)) {
      alert('숫자 값을 입력해 주세요.');
      return;
    }

    data.push({ id, value });
    form.reset(); // 입력 필드 초기화
    renderAll(); // 전체 다시 그리기
  });
};

const renderAll = () => {
  renderBarChart();
  renderTable();
  renderTextarea();
};

// 데이터 초기화 이벤트
document.addEventListener('DOMContentLoaded', () => {
  setupAddForm();
  renderAll();
});
