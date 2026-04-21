/**
 * FormBuilder - Logic & Sections
 * Auteur: Manus
 * Fonctionnalités: Redirection par option, Navigation entre sections, 100% Hors-ligne, Export CSV Fix, Insertion dynamique, Icônes de type
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ÉTAT DE L'APPLICATION ---
    let formData = {
        title: "Formulaire sans titre",
        description: "",
        elements: [], // Questions et Sections
    };

    let responses = []; 
    let activeElementIndex = -1; 

    // Configuration des types avec icônes
    const typeConfig = {
        'short': { label: 'Réponse courte', icon: '≡' },
        'paragraph': { label: 'Paragraphe', icon: '≣' },
        'multiple': { label: 'Choix multiple', icon: '⦿' },
        'checkbox': { label: 'Cases à cocher', icon: '☑' },
        'dropdown': { label: 'Liste déroulante', icon: '▼' },
        'linear': { label: 'Échelle linéaire', icon: '⚬-⚬' },
        'grid': { label: 'Grille à choix multiple', icon: '⠿' },
        'grid-check': { label: 'Grille de cases à cocher', icon: '▦' },
        'date': { label: 'Date', icon: '📅' },
        'time': { label: 'Heure', icon: '🕒' }
    };

    // --- SÉLECTEURS DOM ---
    const questionsList = document.getElementById('questions-list');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const addSectionBtn = document.getElementById('add-section-btn');
    const previewBtn = document.getElementById('preview-btn');
    const closePreviewBtn = document.getElementById('close-preview');
    const previewView = document.getElementById('preview-view');
    const previewFormContainer = document.getElementById('preview-form-container');
    const saveFileBtn = document.getElementById('save-file-btn');
    const openFileBtn = document.getElementById('open-file-btn');
    const newFormBtn = document.getElementById('new-form-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const fileInput = document.getElementById('file-input');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const formTitleInput = document.getElementById('form-title-input');
    const formDisplayTitle = document.getElementById('form-display-title');
    const formDescription = document.getElementById('form-description');

    // --- INITIALISATION ---
    function init() {
        resetToNewForm();
        setupEventListeners();
        renderElements();
    }

    function resetToNewForm() {
        formData = {
            title: "Formulaire sans titre",
            description: "",
            elements: [],
        };
        responses = [];
        activeElementIndex = -1;
        formTitleInput.value = formData.title;
        formDisplayTitle.value = formData.title;
        formDescription.value = formData.description;
        renderElements();
        updateResponseTable();
    }

    // --- GESTION DES ÉLÉMENTS ---
    function addQuestion() {
        const id = 'q_' + Date.now();
        const newQuestion = {
            id,
            type: 'multiple',
            title: "",
            required: false,
            options: ["Option 1"],
            rows: ["Ligne 1"],
            cols: ["Colonne 1"],
            optionLogics: {},
            logicEnabled: false,
            elementType: 'question'
        };

        if (activeElementIndex === -1) {
            formData.elements.push(newQuestion);
            activeElementIndex = formData.elements.length - 1;
        } else {
            formData.elements.splice(activeElementIndex + 1, 0, newQuestion);
            activeElementIndex++;
        }
        renderElements();
    }

    function addSection() {
        const id = 's_' + Date.now();
        const newSection = {
            id,
            title: "Section sans titre",
            description: "",
            afterSection: 'next',
            elementType: 'section'
        };

        if (activeElementIndex === -1) {
            formData.elements.push(newSection);
            activeElementIndex = formData.elements.length - 1;
        } else {
            formData.elements.splice(activeElementIndex + 1, 0, newSection);
            activeElementIndex++;
        }
        renderElements();
    }

    function renderElements() {
        questionsList.innerHTML = '';
        let sectionCounter = 1;
        const availableSections = formData.elements
            .filter(el => el.elementType === 'section')
            .map((s, i) => ({ id: s.id, label: `Section ${i + 2}: ${s.title || '(Sans titre)'}` }));

        formData.elements.forEach((el, index) => {
            let node;
            if (el.elementType === 'section') {
                sectionCounter++;
                node = createSectionNode(el, index, sectionCounter, availableSections);
            } else {
                node = createQuestionNode(el, index, availableSections);
            }
            
            if (index === activeElementIndex) {
                node.classList.add('active-card');
            }
            
            node.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn') || e.target.closest('.custom-select-wrapper')) return;
                activeElementIndex = index;
                document.querySelectorAll('.question-card, .section-card').forEach(c => c.classList.remove('active-card'));
                node.classList.add('active-card');
            });

            questionsList.appendChild(node);
        });
    }

    function createSectionNode(s, index, num, availableSections) {
        const template = document.getElementById('section-template');
        const clone = template.content.cloneNode(true);
        const node = clone.querySelector('.section-card');
        node.querySelector('.section-num-display').innerText = num;
        
        const titleInput = node.querySelector('.section-title');
        titleInput.value = s.title;
        titleInput.oninput = (e) => { s.title = e.target.value; };

        const descInput = node.querySelector('.section-desc');
        descInput.value = s.description;
        descInput.oninput = (e) => { s.description = e.target.value; };

        const afterSelect = node.querySelector('.after-section-select');
        availableSections.forEach(sec => {
            if (sec.id !== s.id) {
                const opt = document.createElement('option');
                opt.value = sec.id;
                opt.innerText = `Accéder à la ${sec.label}`;
                afterSelect.appendChild(opt);
            }
        });
        afterSelect.value = s.afterSection || 'next';
        afterSelect.onchange = (e) => { s.afterSection = e.target.value; };

        node.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            formData.elements.splice(index, 1);
            if (activeElementIndex >= formData.elements.length) {
                activeElementIndex = formData.elements.length - 1;
            } else if (activeElementIndex === index) {
                activeElementIndex = -1;
            }
            renderElements();
        };
        return node;
    }

    function createQuestionNode(q, index, availableSections) {
        const template = document.getElementById('question-template');
        const clone = template.content.cloneNode(true);
        const node = clone.querySelector('.question-card');

        const titleInput = node.querySelector('.question-title');
        titleInput.value = q.title;
        titleInput.oninput = (e) => { q.title = e.target.value; };

        // Gestion du sélecteur personnalisé
        const selectWrapper = node.querySelector('.type-select-wrapper');
        const trigger = selectWrapper.querySelector('.custom-select-trigger');
        const optionsContainer = selectWrapper.querySelector('.custom-options');
        
        // Mettre à jour l'affichage initial
        const currentType = typeConfig[q.type];
        trigger.querySelector('.type-icon').innerText = currentType.icon;
        trigger.querySelector('.type-label').innerText = currentType.label;

        trigger.onclick = (e) => {
            e.stopPropagation();
            // Fermer les autres sélecteurs ouverts
            document.querySelectorAll('.custom-options').forEach(opt => {
                if (opt !== optionsContainer) opt.classList.remove('show');
            });
            optionsContainer.classList.toggle('show');
        };

        optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation();
                const val = opt.dataset.value;
                q.type = val;
                if (['grid', 'grid-check'].includes(q.type)) {
                    if (!q.rows) q.rows = ["Ligne 1"];
                    if (!q.cols) q.cols = ["Colonne 1"];
                }
                optionsContainer.classList.remove('show');
                renderElements();
            };
        });

        const logicToggle = node.querySelector('.logic-toggle');
        logicToggle.checked = q.logicEnabled;
        logicToggle.onchange = (e) => {
            q.logicEnabled = e.target.checked;
            renderElements();
        };

        const optionsList = node.querySelector('.options-list');
        renderOptions(q, optionsList, availableSections);

        const requiredToggle = node.querySelector('.required-toggle');
        requiredToggle.checked = q.required;
        requiredToggle.onchange = (e) => { q.required = e.target.checked; };

        const deleteBtn = node.querySelector('.delete-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            formData.elements.splice(index, 1);
            if (activeElementIndex >= formData.elements.length) {
                activeElementIndex = formData.elements.length - 1;
            } else if (activeElementIndex === index) {
                activeElementIndex = -1;
            }
            renderElements();
        };
        return node;
    }

    function renderOptions(q, container, availableSections) {
        container.innerHTML = '';
        if (['multiple', 'checkbox', 'dropdown'].includes(q.type)) {
            q.options.forEach((opt, i) => {
                const div = document.createElement('div');
                div.className = 'option-row';
                let logicHtml = '';
                if (q.logicEnabled && q.type === 'multiple') {
                    logicHtml = `<select class="logic-select">
                        <option value="next">Passer à la section suivante</option>
                        <option value="submit">Envoyer le formulaire</option>
                        ${availableSections.map(s => `<option value="${s.id}" ${q.optionLogics[i] === s.id ? 'selected' : ''}>Accéder à la ${s.label}</option>`).join('')}
                    </select>`;
                }
                div.innerHTML = `
                    <input type="${q.type === 'multiple' ? 'radio' : 'checkbox'}" disabled>
                    <input type="text" class="option-input" value="${opt}">
                    ${logicHtml}
                    <button class="delete-btn-opt" style="background:none; border:none; color:#70757a; font-size:18px; cursor:pointer;">×</button>
                `;
                const input = div.querySelector('.option-input');
                input.oninput = (e) => { q.options[i] = e.target.value; };
                if (q.logicEnabled && q.type === 'multiple') {
                    const sel = div.querySelector('.logic-select');
                    sel.onchange = (e) => { q.optionLogics[i] = e.target.value; };
                }
                div.querySelector('.delete-btn-opt').onclick = (e) => {
                    e.stopPropagation();
                    q.options.splice(i, 1);
                    delete q.optionLogics[i];
                    renderOptions(q, container, availableSections);
                };
                container.appendChild(div);
            });
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-secondary';
            addBtn.style.marginTop = '10px';
            addBtn.innerText = '+ Ajouter une option';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                q.options.push(`Option ${q.options.length + 1}`);
                renderOptions(q, container, availableSections);
            };
            container.appendChild(addBtn);
        } else if (['grid', 'grid-check'].includes(q.type)) {
            const gridDiv = document.createElement('div');
            gridDiv.className = 'grid-config';
            
            const rowsCol = document.createElement('div');
            rowsCol.className = 'grid-col';
            rowsCol.innerHTML = '<h4>Lignes</h4>';
            q.rows.forEach((row, i) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'option-row';
                rowDiv.innerHTML = `<input type="text" class="option-input" value="${row}"><button class="delete-btn-opt" style="background:none; border:none; color:#70757a; font-size:18px; cursor:pointer;">×</button>`;
                rowDiv.querySelector('input').oninput = (e) => { q.rows[i] = e.target.value; };
                rowDiv.querySelector('.delete-btn-opt').onclick = (e) => { e.stopPropagation(); q.rows.splice(i, 1); renderOptions(q, container, availableSections); };
                rowsCol.appendChild(rowDiv);
            });
            const addRow = document.createElement('button');
            addRow.className = 'btn-secondary'; addRow.innerText = '+ Ligne';
            addRow.onclick = (e) => { e.stopPropagation(); q.rows.push(`Ligne ${q.rows.length + 1}`); renderOptions(q, container, availableSections); };
            rowsCol.appendChild(addRow);

            const colsCol = document.createElement('div');
            colsCol.className = 'grid-col';
            colsCol.innerHTML = '<h4>Colonnes</h4>';
            q.cols.forEach((col, i) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'option-row';
                colDiv.innerHTML = `<input type="text" class="option-input" value="${col}"><button class="delete-btn-opt" style="background:none; border:none; color:#70757a; font-size:18px; cursor:pointer;">×</button>`;
                colDiv.querySelector('input').oninput = (e) => { q.cols[i] = e.target.value; };
                colDiv.querySelector('.delete-btn-opt').onclick = (e) => { e.stopPropagation(); q.cols.splice(i, 1); renderOptions(q, container, availableSections); };
                colsCol.appendChild(colDiv);
            });
            const addCol = document.createElement('button');
            addCol.className = 'btn-secondary'; addCol.innerText = '+ Colonne';
            addCol.onclick = (e) => { e.stopPropagation(); q.cols.push(`Colonne ${q.cols.length + 1}`); renderOptions(q, container, availableSections); };
            colsCol.appendChild(addCol);

            gridDiv.appendChild(rowsCol);
            gridDiv.appendChild(colsCol);
            container.appendChild(gridDiv);
        } else if (q.type === 'linear') {
            container.innerHTML = `<div class="linear-config">Échelle de 1 à 5</div>`;
        } else {
            container.innerHTML = `<p style="color:var(--text-sec); font-style:italic; font-size:14px;">Type: ${q.type}</p>`;
        }
    }

    // --- APERÇU & NAVIGATION ---
    function renderPreview() {
        const pages = [];
        let currentPage = { title: formData.title, desc: formData.description, elements: [], after: 'next' };
        formData.elements.forEach(el => {
            if (el.elementType === 'section') {
                pages.push(currentPage);
                currentPage = { id: el.id, title: el.title, desc: el.description, elements: [], after: el.afterSection };
            } else {
                currentPage.elements.push(el);
            }
        });
        pages.push(currentPage);
        showPreviewPage(pages, 0);
    }

    function showPreviewPage(pages, index) {
        const page = pages[index];
        previewFormContainer.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'form-header-card';
        header.innerHTML = `<h1>${page.title || 'Section sans titre'}</h1><p>${page.desc || ''}</p>`;
        previewFormContainer.appendChild(header);

        page.elements.forEach(el => {
            const div = document.createElement('div');
            div.className = 'question-card';
            let inputHtml = '';
            if (el.type === 'short') inputHtml = `<input type="text" class="prev-in" data-id="${el.id}" placeholder="Votre réponse" style="width:100%; border:none; border-bottom:1px solid #ddd; padding:10px 0;">`;
            else if (el.type === 'paragraph') inputHtml = `<textarea class="prev-in" data-id="${el.id}" placeholder="Votre réponse" style="width:100%; border:none; border-bottom:1px solid #ddd; padding:10px 0; min-height:60px;"></textarea>`;
            else if (['multiple', 'checkbox', 'dropdown'].includes(el.type)) {
                inputHtml = el.options.map((opt, i) => `
                    <label style="display:block; margin:10px 0; cursor:pointer;">
                        <input type="${el.type === 'multiple' ? 'radio' : (el.type === 'checkbox' ? 'checkbox' : 'radio')}" name="${el.id}" value="${opt}" class="prev-in" data-idx="${i}"> ${opt}
                    </label>
                `).join('');
            } else if (['grid', 'grid-check'].includes(el.type)) {
                let table = `<table class="preview-grid-table"><thead><tr><th></th>${el.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
                el.rows.forEach(r => {
                    table += `<tr><td>${r}</td>${el.cols.map(c => `<td><input type="${el.type === 'grid' ? 'radio' : 'checkbox'}" name="${el.id}_${r}" value="${c}" class="prev-in"></td>`).join('')}</tr>`;
                });
                table += '</tbody></table>';
                inputHtml = table;
            } else if (el.type === 'date') inputHtml = `<input type="date" class="prev-in" data-id="${el.id}">`;
            else if (el.type === 'time') inputHtml = `<input type="time" class="prev-in" data-id="${el.id}">`;
            
            div.innerHTML = `<div style="font-weight:500; margin-bottom:15px;">${el.title} ${el.required ? '<span style="color:red">*</span>' : ''}</div><div>${inputHtml}</div>`;
            previewFormContainer.appendChild(div);
        });

        const navDiv = document.createElement('div');
        navDiv.style.display = 'flex'; navDiv.style.justifyContent = 'space-between'; navDiv.style.marginTop = '20px';
        if (index > 0) {
            const backBtn = document.createElement('button');
            backBtn.className = 'btn-secondary'; backBtn.innerText = 'Retour';
            backBtn.onclick = () => showPreviewPage(pages, index - 1);
            navDiv.appendChild(backBtn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-primary';
        const isLast = index === pages.length - 1 || page.after === 'submit';
        nextBtn.innerText = isLast ? 'Envoyer' : 'Suivant';
        nextBtn.onclick = () => {
            if (isLast) {
                const currentResponse = { timestamp: new Date().toLocaleString(), data: {} };
                formData.elements.forEach(el => {
                    if (el.elementType === 'question') {
                        const inputs = document.querySelectorAll(`.prev-in[name="${el.id}"], .prev-in[data-id="${el.id}"]`);
                        if (el.type === 'checkbox') {
                            currentResponse.data[el.id] = Array.from(inputs).filter(i => i.checked).map(i => i.value).join(', ');
                        } else if (el.type === 'multiple') {
                            const checked = Array.from(inputs).find(i => i.checked);
                            currentResponse.data[el.id] = checked ? checked.value : '';
                        } else if (inputs.length > 0) {
                            currentResponse.data[el.id] = inputs[0].value;
                        }
                    }
                });
                responses.push(currentResponse);
                updateResponseTable();
                alert('Réponse envoyée !');
                previewView.classList.add('hidden');
            } else {
                let targetIndex = index + 1;
                page.elements.forEach(el => {
                    if (el.elementType === 'question' && el.logicEnabled && el.type === 'multiple') {
                        const selected = previewFormContainer.querySelector(`input[name="${el.id}"]:checked`);
                        if (selected) {
                            const optIdx = selected.getAttribute('data-idx');
                            const targetId = el.optionLogics[optIdx];
                            if (targetId && targetId !== 'next') {
                                if (targetId === 'submit') { alert('Envoyé !'); previewView.classList.add('hidden'); return; }
                                const foundIdx = pages.findIndex(p => p.id === targetId);
                                if (foundIdx !== -1) targetIndex = foundIdx;
                            }
                        }
                    }
                });
                if (page.after && page.after !== 'next') {
                    if (page.after === 'submit') { alert('Envoyé !'); previewView.classList.add('hidden'); return; }
                    const foundIdx = pages.findIndex(p => p.id === page.after);
                    if (foundIdx !== -1) targetIndex = foundIdx;
                }
                showPreviewPage(pages, targetIndex);
            }
        };
        navDiv.appendChild(nextBtn);
        previewFormContainer.appendChild(navDiv);
    }

    // --- RÉPONSES & CSV ---
    function updateResponseTable() {
        const headerRow = document.getElementById('table-header');
        const body = document.getElementById('table-body');
        const count = document.getElementById('response-count');
        if (!headerRow || !body || !count) return;
        count.innerText = `${responses.length} réponses`;
        headerRow.innerHTML = '<th>Horodatage</th>';
        const questions = formData.elements.filter(e => e.elementType === 'question');
        questions.forEach(q => { headerRow.innerHTML += `<th>${q.title || 'Question'}</th>`; });
        body.innerHTML = '';
        responses.forEach(resp => {
            let row = `<td>${resp.timestamp}</td>`;
            questions.forEach(q => { row += `<td>${resp.data[q.id] || '-'}</td>`; });
            body.innerHTML += `<tr>${row}</tr>`;
        });
    }

    exportCsvBtn.onclick = () => {
        if (responses.length === 0) return alert('Aucune réponse.');
        const questions = formData.elements.filter(e => e.elementType === 'question');
        let csv = 'Horodatage,' + questions.map(q => `"${q.title || 'Question'}"`).join(',') + '\n';
        responses.forEach(resp => {
            csv += `"${resp.timestamp}",` + questions.map(q => `"${resp.data[q.id] || ''}"`).join(',') + '\n';
        });
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reponses_${formData.title.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    // --- SYSTÈME DE FICHIERS ---
    saveFileBtn.onclick = () => {
        const dataStr = JSON.stringify(formData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formData.title.replace(/\s+/g, '_')}.json`;
        link.click();
    };

    openFileBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                formData = JSON.parse(event.target.result);
                formTitleInput.value = formData.title;
                formDisplayTitle.value = formData.title;
                formDescription.value = formData.description;
                activeElementIndex = -1;
                renderElements();
            } catch (err) { alert('Erreur.'); }
        };
        reader.readAsText(file);
    };

    newFormBtn.onclick = () => { if (confirm('Nouveau formulaire ?')) resetToNewForm(); };

    function setupEventListeners() {
        addQuestionBtn.onclick = addQuestion;
        addSectionBtn.onclick = addSection;
        formTitleInput.oninput = (e) => { formData.title = e.target.value; formDisplayTitle.value = e.target.value; };
        formDisplayTitle.oninput = (e) => { formData.title = e.target.value; formTitleInput.value = e.target.value; };
        formDescription.oninput = (e) => { formData.description = e.target.value; };
        previewBtn.onclick = () => { renderPreview(); previewView.classList.remove('hidden'); };
        closePreviewBtn.onclick = () => previewView.classList.add('hidden');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-view`).classList.add('active');
            };
        });
        
        // Fermer les sélecteurs au clic ailleurs
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-options').forEach(opt => opt.classList.remove('show'));
        });
    }

    init();
});
