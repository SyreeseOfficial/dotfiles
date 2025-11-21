const widgetHTML = `
  <div id="sk-sticky-btn">+</div>
  
  <div id="sk-widget-container">
    <div class="sk-header">
      <h1>Skool Templates</h1>
    </div>

    <div id="sk-view-list">
      <button id="sk-btn-new" class="sk-new-btn">
        <div class="sk-circle-plus">+</div>
        <span>New Post</span>
      </button>
      <div id="sk-template-list" class="sk-template-list">
        </div>
    </div>

    <div id="sk-view-form" class="hidden">
      <input type="text" id="sk-title-input" class="sk-input" placeholder="Enter title...">
      <textarea id="sk-body-input" class="sk-input" placeholder="Type body text here..."></textarea>
      <div class="sk-form-btns">
        <button id="sk-save-btn" class="sk-btn-blue">Save</button>
        <button id="sk-cancel-btn" class="sk-btn-red">Cancel</button>
      </div>
    </div>

    <div class="sk-footer">
      <div class="sk-banner">
        <div class="sk-up-title">Upgrade for $2.99 / Mo</div>
        <div class="sk-up-sub">(Coming Soon)</div>
      </div>
      <div class="sk-desc">Access to dates, exporting templates, unlimited templates & more.</div>
    </div>
  </div>
`;

const div = document.createElement('div');
div.innerHTML = widgetHTML;
document.body.appendChild(div);

const stickyBtn = document.getElementById('sk-sticky-btn');
const container = document.getElementById('sk-widget-container');
const viewList = document.getElementById('sk-view-list');
const viewForm = document.getElementById('sk-view-form');
const templateList = document.getElementById('sk-template-list');

const btnNew = document.getElementById('sk-btn-new');
const btnSave = document.getElementById('sk-save-btn');
const btnCancel = document.getElementById('sk-cancel-btn');
const inputTitle = document.getElementById('sk-title-input');
const inputBody = document.getElementById('sk-body-input');

let isOpen = false;
stickyBtn.addEventListener('click', () => {
  isOpen = !isOpen;
  if (isOpen) {
    container.classList.add('visible');
    stickyBtn.innerText = '×';
    stickyBtn.style.backgroundColor = '#D06353';
    loadTemplates();
  } else {
    container.classList.remove('visible');
    stickyBtn.innerText = '+';
    stickyBtn.style.backgroundColor = '#E0C46C';
  }
});

btnNew.addEventListener('click', () => {
  viewList.classList.add('hidden');
  viewForm.classList.remove('hidden');
  inputTitle.focus();
});

btnCancel.addEventListener('click', () => {
  resetForm();
  viewForm.classList.add('hidden');
  viewList.classList.remove('hidden');
});

btnSave.addEventListener('click', () => {
  const title = inputTitle.value.trim();
  const body = inputBody.value.trim();

  if (!title) {
    alert('Please enter a title');
    return;
  }

  const newTemplate = {
    id: Date.now(),
    title: title,
    body: body
  };

  chrome.storage.local.get(['templates'], (result) => {
    const templates = result.templates || [];
    templates.push(newTemplate);
    chrome.storage.local.set({ templates: templates }, () => {
      resetForm();
      viewForm.classList.add('hidden');
      viewList.classList.remove('hidden');
      loadTemplates();
    });
  });
});

function loadTemplates() {
  chrome.storage.local.get(['templates'], (result) => {
    const templates = result.templates || [];
    templateList.innerHTML = '';

    if (templates.length === 0) {
      templateList.innerHTML = '<div style="color:#666; text-align:center; padding:20px; font-size: 16px;">No templates yet.</div>';
      return;
    }

    templates.forEach(temp => {
      const row = document.createElement('div');
      row.className = 'sk-row';
      row.innerHTML = `
        <div class="sk-t-title">${temp.title}</div>
        <div class="sk-actions">
          <button class="sk-btn-sm sk-copy">Copy</button>
          <button class="sk-btn-sm sk-del">Delete</button>
        </div>
      `;

      const copyBtn = row.querySelector('.sk-copy');
      copyBtn.addEventListener('click', () => {
        const fullText = `${temp.title}\n\n${temp.body}`;
        navigator.clipboard.writeText(fullText).then(() => {
          copyBtn.innerText = 'Copied!';
          setTimeout(() => copyBtn.innerText = 'Copy', 1000);
        });
      });

      row.querySelector('.sk-del').addEventListener('click', () => {
        deleteTemplate(temp.id);
      });

      templateList.appendChild(row);
    });
  });
}

function deleteTemplate(id) {
  chrome.storage.local.get(['templates'], (result) => {
    let templates = result.templates || [];
    templates = templates.filter(t => t.id !== id);
    chrome.storage.local.set({ templates: templates }, loadTemplates);
  });
}

function resetForm() {
  inputTitle.value = '';
  inputBody.value = '';
}
