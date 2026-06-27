// DOM Elements
const studentInput = document.getElementById('studentInput');
const btnAddStudent = document.getElementById('btnAddStudent');
const studentListEl = document.getElementById('studentList');
const totalCountEl = document.getElementById('totalCount');
const btnDownload = document.getElementById('btnDownload');
const fileInput = document.getElementById('fileInput');
const btnClearAll = document.getElementById('btnClearAll');
const slotDisplay = document.getElementById('slotDisplay');
const extractCountSelect = document.getElementById('extractCount');
const btnExtract = document.getElementById('btnExtract');

// Secret Menu Elements
const secretTrigger = document.getElementById('secretTrigger');
const secretModal = document.getElementById('secretModal');
const secretInput = document.getElementById('secretInput');
const btnSecretSave = document.getElementById('btnSecretSave');
const btnSecretCancel = document.getElementById('btnSecretCancel');

// State
let students = [];
let secretQueue = [];
let isSpinning = false;

// Initialize
function updateStudentListUI() {
  studentListEl.innerHTML = '';
  students.forEach((student, index) => {
    const tag = document.createElement('div');
    tag.className = 'md-chip';
    tag.innerHTML = `
      ${student}
      <button onclick="removeStudent(${index})"><span class="material-symbols-outlined">close</span></button>
    `;
    studentListEl.appendChild(tag);
  });
  totalCountEl.textContent = students.length;
}

function addStudents(namesStr) {
  const names = namesStr.split(/[,\n]+/).map(n => n.trim()).filter(n => n !== '');
  names.forEach(name => {
    if (!students.includes(name)) {
      students.push(name);
    }
  });
  updateStudentListUI();
}

function removeStudent(index) {
  students.splice(index, 1);
  updateStudentListUI();
}

// Event Listeners for Student Management
btnAddStudent.addEventListener('click', () => {
  addStudents(studentInput.value);
  studentInput.value = '';
});

studentInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addStudents(studentInput.value);
    studentInput.value = '';
  }
});

btnClearAll.addEventListener('click', () => {
  if (confirm('모든 명단을 지우시겠습니까?')) {
    students = [];
    updateStudentListUI();
  }
});

// File Handling
btnDownload.addEventListener('click', () => {
  if (students.length === 0) return alert('저장할 명단이 없습니다.');
  const blob = new Blob([students.join('\n')], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '학생명단.txt';
  a.click();
  window.URL.revokeObjectURL(url);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    addStudents(event.target.result);
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset
});

// Secret Menu Logic
let triggerClicks = 0;
let triggerTimeout;

secretTrigger.addEventListener('click', () => {
  triggerClicks++;
  clearTimeout(triggerTimeout);
  if (triggerClicks >= 3) {
    secretModal.classList.add('active');
    secretInput.value = secretQueue.join('\n');
    triggerClicks = 0;
  } else {
    triggerTimeout = setTimeout(() => {
      triggerClicks = 0;
    }, 1000);
  }
});

btnSecretCancel.addEventListener('click', () => {
  secretModal.classList.remove('active');
});

btnSecretSave.addEventListener('click', () => {
  secretQueue = secretInput.value.split(/[,\n]+/).map(n => n.trim()).filter(n => n !== '');
  secretModal.classList.remove('active');
});

// Slot Machine Logic
function createSlot(initialText = '?') {
  const slot = document.createElement('div');
  slot.className = 'slot';
  const textEl = document.createElement('div');
  textEl.textContent = initialText;
  slot.appendChild(textEl);
  return { el: slot, textEl: textEl };
}

function initializeSlots(count) {
  slotDisplay.innerHTML = '';
  const slotObjects = [];
  for (let i = 0; i < count; i++) {
    const slotObj = createSlot();
    slotDisplay.appendChild(slotObj.el);
    slotObjects.push(slotObj);
  }
  return slotObjects;
}

btnExtract.addEventListener('click', async () => {
  if (isSpinning) return;
  if (students.length === 0) return alert('학생 명단을 추가해주세요!');
  
  const extractCount = parseInt(extractCountSelect.value);
  if (extractCount > students.length) {
    return alert('추출 인원이 전체 학생 수보다 많습니다!');
  }

  isSpinning = true;
  btnExtract.disabled = true;

  // Determine winners
  let availableStudents = [...students];
  const winners = [];

  for (let i = 0; i < extractCount; i++) {
    let winner = null;
    // Check secret queue first
    for (let j = 0; j < secretQueue.length; j++) {
      const secretName = secretQueue[j];
      const indexInAvailable = availableStudents.indexOf(secretName);
      if (indexInAvailable !== -1) {
        winner = secretName;
        availableStudents.splice(indexInAvailable, 1);
        secretQueue.splice(j, 1);
        break;
      }
    }

    // Fallback to random
    if (!winner) {
      const randomIndex = Math.floor(Math.random() * availableStudents.length);
      winner = availableStudents[randomIndex];
      availableStudents.splice(randomIndex, 1);
    }
    winners.push(winner);
  }

  // UI Animation Setup
  const slotObjects = initializeSlots(extractCount);
  
  // Animate each slot sequentially
  for (let i = 0; i < extractCount; i++) {
    const slotObj = slotObjects[i];
    const targetWinner = winners[i];
    
    // Create a roller for animation
    const roller = document.createElement('div');
    roller.className = 'name-roller';
    
    // Add dummy names for spinning effect
    const spinItems = [];
    for(let j=0; j<20; j++) {
       spinItems.push(students[Math.floor(Math.random() * students.length)]);
    }
    spinItems.push(targetWinner); // Target is the last one
    
    // Duplicate for smooth infinite loop before stopping
    const allItems = [...spinItems, ...spinItems];
    
    allItems.forEach(name => {
      const div = document.createElement('div');
      div.className = 'name-item';
      div.textContent = name;
      roller.appendChild(div);
    });

    slotObj.el.innerHTML = '';
    slotObj.el.appendChild(roller);
    slotObj.el.classList.add('spinning');

    // Wait some time to stop
    await new Promise(resolve => setTimeout(resolve, 800 + (i * 400)));
    
    // Stop animation and set final result
    slotObj.el.classList.remove('spinning');
    slotObj.el.innerHTML = '';
    const finalName = document.createElement('div');
    finalName.textContent = targetWinner;
    // Simple bounce effect on stop
    finalName.style.animation = 'bounceIn 0.5s';
    slotObj.el.appendChild(finalName);
  }

  // Fire Confetti
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a18cd1']
  });

  isSpinning = false;
  btnExtract.disabled = false;
});

// Add bounce keyframe dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.1); opacity: 1; }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);

// Ethics Gate Logic
const ethicsGate = document.getElementById('ethics-gate');
const btnAcceptEthics = document.getElementById('btnAcceptEthics');

if (ethicsGate && btnAcceptEthics) {
  btnAcceptEthics.addEventListener('click', () => {
    ethicsGate.classList.add('hidden');
    // 게이트가 사라진 후 DOM에서 완전히 제거하려면 아래 코드를 사용할 수 있습니다.
    setTimeout(() => {
      ethicsGate.style.display = 'none';
    }, 500); // CSS transition 시간과 동일하게 설정
  });
}
