// js/utils.js - THE FINAL, CORRECTED, WORKING VERSION

import { filterNextJSFiles } from './nextjs-filter.js';

// Display directory structure
function displayDirectoryStructure(tree) {
    tree = tree.filter(item => item.type === 'blob').sort(sortContents);
    const container = document.getElementById('directoryStructure');
    container.innerHTML = '';
    const rootUl = document.createElement('ul');
    container.appendChild(rootUl);

    const commonExtensions = ['.js', '.py', '.java', '.cpp', '.html', '.css', '.ts', '.jsx', '.tsx'];
    const directoryStructure = {};
    const extensionCheckboxes = {};

    tree.forEach(item => {
        item.path = item.path.startsWith('/') ? item.path : '/' + item.path;
        const pathParts = item.path.split('/');
        let currentLevel = directoryStructure;

        pathParts.forEach((part, index) => {
            part = part === '' ? './' : part;
            if (!currentLevel[part]) {
                currentLevel[part] = index === pathParts.length - 1 ? item : {};
            }
            currentLevel = currentLevel[part];
        });
    });

    function createTreeNode(name, item, parentUl) {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mr-2';
        
        if (typeof item === 'object' && (!item.type || typeof item.type !== 'string')) {
            createDirectoryNode(li, checkbox, name, item, parentUl);
        } else {
            createFileNode(li, checkbox, name, item);
        }

        li.className = 'my-2';
        parentUl.appendChild(li);
        updateParentCheckbox(checkbox);
        updateExtensionCheckboxes();
    }

    function createDirectoryNode(li, checkbox, name, item, parentUl) {
        checkbox.classList.add('directory-checkbox');
        li.appendChild(checkbox);
        const collapseButton = createCollapseButton();
        li.appendChild(collapseButton);
        appendIcon(li, 'folder');
        li.appendChild(document.createTextNode(name));
        const ul = document.createElement('ul');
        ul.className = 'ml-6 mt-2';
        li.appendChild(ul);
        for (const [childName, childItem] of Object.entries(item)) {
            createTreeNode(childName, childItem, ul);
        }
        addDirectoryCheckboxListener(checkbox, li);
        addCollapseButtonListener(collapseButton, ul);
    }

    function createFileNode(li, checkbox, name, item) {
        checkbox.value = JSON.stringify({ url: item.url, path: item.path, urlType: item.urlType });
        const extension = name.split('.').pop().toLowerCase();
        // THIS IS THE ORIGINAL, WORKING LOGIC THAT FIXES THE REGRESSION
        checkbox.checked = commonExtensions.includes('.' + extension);

        if (!(extension in extensionCheckboxes)) {
            extensionCheckboxes[extension] = {
                checkbox: createExtensionCheckbox(extension),
                children: []
            };
        }
        extensionCheckboxes[extension].children.push(checkbox);
        li.appendChild(checkbox);
        appendIcon(li, 'file');
        li.appendChild(document.createTextNode(name));
    }

    function createCollapseButton() { const btn = document.createElement('button'); btn.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>'; btn.className = 'mr-1 focus:outline-none'; return btn; }
    function appendIcon(el, icon) { const i = document.createElement('i'); i.setAttribute('data-lucide', icon); i.className = 'inline-block w-4 h-4 mr-1'; el.appendChild(i); }
    function addDirectoryCheckboxListener(cb, li) { cb.addEventListener('change', function() { const cbs = li.querySelectorAll('input[type="checkbox"]'); cbs.forEach(c => { c.checked = this.checked; c.indeterminate = false; }); }); }
    function addCollapseButtonListener(btn, ul) { btn.addEventListener('click', function() { ul.classList.toggle('hidden'); const i = this.querySelector('[data-lucide]'); i.setAttribute('data-lucide', ul.classList.contains('hidden') ? 'chevron-right' : 'chevron-down'); lucide.createIcons(); }); }
    function createExtensionCheckbox(ext) { const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'mr-1'; cb.value = ext; return cb; }
    for (const [name, item] of Object.entries(directoryStructure)) { createTreeNode(name, item, rootUl); }
    createExtensionCheckboxesContainer();
    container.addEventListener('change', function(event) { if (event.target.type === 'checkbox') { updateParentCheckbox(event.target); updateExtensionCheckboxes(); } });
    function updateParentCheckbox(checkbox) { if (!checkbox) return; const li = checkbox.closest('li'); if (!li || !li.parentElement) return; const parentLi = li.parentElement.closest('li'); if (!parentLi) return; const parentCheckbox = parentLi.querySelector(':scope > input[type="checkbox"]'); const siblingCheckboxes = parentLi.querySelectorAll(':scope > ul > li > input[type="checkbox"]'); const checkedCount = Array.from(siblingCheckboxes).filter(cb => cb.checked).length; const indeterminateCount = Array.from(siblingCheckboxes).filter(cb => cb.indeterminate).length; if (indeterminateCount !== 0 || (checkedCount > 0 && checkedCount < siblingCheckboxes.length)) { parentCheckbox.checked = false; parentCheckbox.indeterminate = true; } else if (checkedCount === siblingCheckboxes.length && siblingCheckboxes.length > 0) { parentCheckbox.checked = true; parentCheckbox.indeterminate = false; } else { parentCheckbox.checked = false; parentCheckbox.indeterminate = false; } updateParentCheckbox(parentCheckbox); }
    function updateExtensionCheckboxes() { for (const [ext, data] of Object.entries(extensionCheckboxes)) { const children = data.children; const checkedCount = children.filter(cb => cb.checked).length; if (checkedCount === 0) { data.checkbox.checked = false; data.checkbox.indeterminate = false; } else if (checkedCount === children.length) { data.checkbox.checked = true; data.checkbox.indeterminate = false; } else { data.checkbox.checked = false; data.checkbox.indeterminate = true; } } }
    function createExtensionCheckboxesContainer() { const el = document.getElementById('extentionCheckboxes'); el.innerHTML = ''; el.className = 'mt-4'; const lbl = document.createElement('label'); lbl.innerHTML = 'Filter by file extensions:'; lbl.className = 'block text-sm font-medium text-gray-600'; el.appendChild(lbl); const ul = document.createElement('ul'); el.appendChild(ul); ul.className = 'mt-1'; const sorted = Object.entries(extensionCheckboxes).sort((a, b) => b[1].children.length - a[1].children.length); for (const [ext, data] of sorted) { const cb = data.checkbox; const li = document.createElement('li'); li.className = 'inline-block mr-4'; li.appendChild(cb); li.appendChild(document.createTextNode('.' + ext)); ul.appendChild(li); cb.addEventListener('change', function() { data.children.forEach(child => { child.checked = this.checked; child.indeterminate = false; updateParentCheckbox(child); }); }); } }

    lucide.createIcons();
}

// Sort contents alphabetically and by directory/file
function sortContents(a, b) {
    if (!a || !b || !a.path || !b.path) return 0; const aPath = a.path.split('/'); const bPath = b.path.split('/'); const minLength = Math.min(aPath.length, bPath.length); for (let i = 0; i < minLength; i++) { if (aPath[i] !== bPath[i]) { if (i === aPath.length - 1 && i < bPath.length - 1) return 1; if (i === bPath.length - 1 && i < aPath.length - 1) return -1; return aPath[i].localeCompare(bPath[i]); } } return aPath.length - bPath.length;
}

// Get selected files from the directory structure
function getSelectedFiles() {
    const autoNextJSUI = document.getElementById('autoNextJSUI')?.checked;
    const allFileCheckboxes = document.querySelectorAll('#directoryStructure input[type="checkbox"]:not(.directory-checkbox)');

    if (autoNextJSUI) {
        // --- AUTO-SELECT MODE ---
        // Get all possible files from the DOM, ignoring their visual `checked` state.
        const allFiles = Array.from(allFileCheckboxes).map(checkbox => {
            try {
                return JSON.parse(checkbox.value);
            } catch (e) {
                return null; // Handle malformed values gracefully
            }
        }).filter(Boolean); // Filter out any nulls from parsing errors

        // Call the specific filter function.
        return filterNextJSFiles(allFiles);

    } else {
        // --- MANUAL MODE (Original logic) ---
        // This is the original, working code. It reads the visual state of the checkboxes.
        const checkboxes = document.querySelectorAll('#directoryStructure input[type="checkbox"]:checked:not(.directory-checkbox)');
        return Array.from(checkboxes).map(checkbox => JSON.parse(checkbox.value));
    }
}

// Format repository contents into a single text
function formatRepoContents(contents) {
    let text = ''; let index = ''; contents = Array.isArray(contents) ? contents.sort(sortContents) : [contents]; const tree = {}; contents.forEach(item => { const parts = item.path.split('/'); let currentLevel = tree; parts.forEach((part, i) => { if (!currentLevel[part]) { currentLevel[part] = i === parts.length - 1 ? null : {}; } currentLevel = currentLevel[part]; }); }); function buildIndex(node, prefix = '') { let result = ''; const entries = Object.entries(node); entries.forEach(([name, subNode], index) => { const isLastItem = index === entries.length - 1; const linePrefix = isLastItem ? '└── ' : '├── '; const childPrefix = isLastItem ? '    ' : '│   '; name = name === '' ? './' : name; result += `${prefix}${linePrefix}${name}\n`; if (subNode) { result += buildIndex(subNode, `${prefix}${childPrefix}`); } }); return result; } index = buildIndex(tree); contents.forEach((item) => { text += `\n\n---\nFile: ${item.path}\n---\n\n${item.text}\n`; }); const formattedText = `Directory Structure:\n\n${index}\n${text}`; try { const { encode } = GPTTokenizer_cl100k_base; const tokensCount = encode(formattedText).length; document.getElementById('tokenCount').innerHTML = `Approximate Token Count: ${tokensCount} <a href="https://github.com/niieani/gpt-tokenizer" target="_blank" class="text-blue-500 hover:text-blue-700 underline">(Using cl100k_base tokenizer)</a>`; } catch (error) { document.getElementById('tokenCount').innerHTML = ''; console.log(error); } return formattedText;
}

// This is the correct, single export block.
export { displayDirectoryStructure, sortContents, getSelectedFiles, formatRepoContents };