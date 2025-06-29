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

    // Build directory structure
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
            // Directory node
            createDirectoryNode(li, checkbox, name, item, parentUl);
        } else {
            // File node
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
        const isCommonFile = commonExtensions.includes('.' + extension);
        checkbox.checked = isCommonFile;

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

    function createCollapseButton() {
        const collapseButton = document.createElement('button');
        collapseButton.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
        collapseButton.className = 'mr-1 focus:outline-none';
        return collapseButton;
    }

    function appendIcon(element, iconName) {
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', iconName);
        icon.className = 'inline-block w-4 h-4 mr-1';
        element.appendChild(icon);
    }

    function addDirectoryCheckboxListener(checkbox, li) {
        checkbox.addEventListener('change', function() {
            const childCheckboxes = li.querySelectorAll('input[type="checkbox"]');
            childCheckboxes.forEach(childBox => {
                childBox.checked = this.checked;
                childBox.indeterminate = false;
            });
        });
    }

    function addCollapseButtonListener(collapseButton, ul) {
        collapseButton.addEventListener('click', function() {
            ul.classList.toggle('hidden');
            const icon = this.querySelector('[data-lucide]');
            if (ul.classList.contains('hidden')) {
                icon.setAttribute('data-lucide', 'chevron-right');
            } else {
                icon.setAttribute('data-lucide', 'chevron-down');
            }
            lucide.createIcons();
        });
    }

    function createExtensionCheckbox(extension) {
        const extCheckbox = document.createElement('input');
        extCheckbox.type = 'checkbox';
        extCheckbox.className = 'mr-1';
        extCheckbox.value = extension;
        return extCheckbox;
    }

    for (const [name, item] of Object.entries(directoryStructure)) {
        createTreeNode(name, item, rootUl);
    }

    createExtensionCheckboxesContainer();

    // Add event listener to container for checkbox changes
    container.addEventListener('change', function(event) {
        if (event.target.type === 'checkbox') {
            updateParentCheckbox(event.target);
            updateExtensionCheckboxes();
        }
    });

    function updateParentCheckbox(checkbox) {
        if (!checkbox) return;
        const li = checkbox.closest('li');
        if (!li) return;
        if (!li.parentElement) return;
        const parentLi = li.parentElement.closest('li');
        if (!parentLi) return;

        const parentCheckbox = parentLi.querySelector(':scope > input[type="checkbox"]');
        const siblingCheckboxes = parentLi.querySelectorAll(':scope > ul > li > input[type="checkbox"]');
        
        const checkedCount = Array.from(siblingCheckboxes).filter(cb => cb.checked).length;
        const indeterminateCount = Array.from(siblingCheckboxes).filter(cb => cb.indeterminate).length;
        
        if (indeterminateCount !== 0) {
            parentCheckbox.checked = false;
            parentCheckbox.indeterminate = true;
        } else if (checkedCount === 0) {
            parentCheckbox.checked = false;
            parentCheckbox.indeterminate = false;
        } else if (checkedCount === siblingCheckboxes.length) {
            parentCheckbox.checked = true;
            parentCheckbox.indeterminate = false;
        } else {
            parentCheckbox.checked = false;
            parentCheckbox.indeterminate = true;
        }

        // Recursively update parent checkboxes
        updateParentCheckbox(parentCheckbox);
    }

    function updateExtensionCheckboxes() {
        for (const [extension, checkbox] of Object.entries(extensionCheckboxes)) {
            const children = checkbox.children;
            const checkedCount = Array.from(children).filter(cb => cb.checked).length;

            if (checkedCount === 0) {
                checkbox.checkbox.checked = false;
                checkbox.checkbox.indeterminate = false;
            } else if (checkedCount === children.length) {
                checkbox.checkbox.checked = true;
                checkbox.checkbox.indeterminate = false;
            } else {
                checkbox.checkbox.checked = false;
                checkbox.checkbox.indeterminate = true;
            }
        }
    }

    function createExtensionCheckboxesContainer() {
        const extentionCheckboxesContainer = document.getElementById('extentionCheckboxes');
        extentionCheckboxesContainer.innerHTML = '';
        extentionCheckboxesContainer.className = 'mt-4';
        const extentionCheckboxesContainerLabel = document.createElement('label');
        extentionCheckboxesContainerLabel.innerHTML = 'Filter by file extensions:';
        extentionCheckboxesContainerLabel.className = 'block text-sm font-medium text-gray-600';
        extentionCheckboxesContainer.appendChild(extentionCheckboxesContainerLabel);
        const extentionCheckboxesContainerUl = document.createElement('ul');
        extentionCheckboxesContainer.appendChild(extentionCheckboxesContainerUl);
        extentionCheckboxesContainerUl.className = 'mt-1';
        const sortedExtensions = Object.entries(extensionCheckboxes).sort((a, b) => b[1].children.length - a[1].children.length);
        for (const [extension, checkbox] of sortedExtensions) {
            const extCheckbox = checkbox.checkbox;
            const extCheckboxLi = document.createElement('li');
            extCheckboxLi.className = 'inline-block mr-4';
            extCheckboxLi.appendChild(extCheckbox);
            extCheckboxLi.appendChild(document.createTextNode('.' + extension));
            extentionCheckboxesContainerUl.appendChild(extCheckboxLi);
            extCheckbox.addEventListener('change', function() {
                const children = checkbox.children;
                children.forEach(child => {
                    child.checked = this.checked;
                    child.indeterminate = false;
                    updateParentCheckbox(child);
                });
            });
        }
    }

    lucide.createIcons();
}

// Sort contents alphabetically and by directory/file
function sortContents(a, b) {
    if (!a || !b || !a.path || !b.path) return 0;
    
    const aPath = a.path.split('/');
    const bPath = b.path.split('/');
    const minLength = Math.min(aPath.length, bPath.length);

    for (let i = 0; i < minLength; i++) {
        if (aPath[i] !== bPath[i]) {
            if (i === aPath.length - 1 && i < bPath.length - 1) return 1; // a is a directory, b is a file or subdirectory
            if (i === bPath.length - 1 && i < aPath.length - 1) return -1;  // b is a directory, a is a file or subdirectory
            return aPath[i].localeCompare(bPath[i]);
        }
    }

    return aPath.length - bPath.length;
}

// Get selected files from the directory structure
function getSelectedFiles() {
    const autoNextJSUI = document.getElementById('autoNextJSUI')?.checked;
    const allFileCheckboxes = document.querySelectorAll('#directoryStructure input[type="checkbox"]:not(.directory-checkbox)');
    let selectedFileValues = new Set(); // Use a Set to store the JSON string values to prevent duplicates

    if (autoNextJSUI) {
        // --- AUTO-SELECT LOGIC ---
        // If the auto-select box is checked, we take full control and ignore all manual/default checks.

        // STAGE 1: HARD EXCLUSIONS - If a path matches these, it's NEVER included.
        const excludePatterns = [
            /^\/node_modules\//, /^\/\.next\//, /^\/\.vercel\//, /^\/dist\//, // Build folders
            /^\/api\//, /^\/app\/api\//, // API routes
            /\/route\.(js|ts|jsx|tsx)$/, // ALL route handlers
            /^\/db\//, /^\/prisma\//, /^\/drizzle\//, // Database
            /^\/actions\//, /^\/server\//, /^\/trpc\//, // Server-side logic
            /^\/scripts\//, // Scripts
            /\.test\./, /\.spec\./, // Test files
            /^\/middleware\.(js|ts)$/, // Middleware
            /^\/next\.config\./, // Next.js config
            /^\/drizzle\.config\./, // Drizzle config
            /^\/sitemap\.(js|ts)$/, // Sitemap
            /^\/routes\.(js|ts)$/ // Routes definition
        ];

        // STAGE 2: ALLOWED FILE TYPES
        const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less', '.json', '.svg', '.mdx'];

        // STAGE 3: POSITIVE INCLUSIONS - After passing exclusions, a file MUST match one of these to be included.
        const includeFolders = [
            '/components/', '/ui/', '/styles/', '/theme/', '/design-system/',
            '/assets/', '/public/', '/css/', '/sass/', '/scss/'
        ];
        const includeFiles = [
            '/app/globals.css',
            'tailwind.config.js', 'tailwind.config.ts',
            'postcss.config.js', 'postcss.config.mjs',
            '/lib/utils.ts', '/lib/utils.js' // The 'cn' utility
        ];
        // Regex to match essential App Router UI files (layout, page, etc.)
        const appRouterUIPattern = /(\/|^)(page|layout|template|loading|error|not-found)\.(tsx|js|jsx)$/;

        allFileCheckboxes.forEach(checkbox => {
            if (!checkbox.value) return;
            try {
                const fileInfo = JSON.parse(checkbox.value);
                const path = fileInfo.path;

                // STAGE 1 CHECK
                if (excludePatterns.some(pattern => pattern.test(path))) {
                    return;
                }

                // STAGE 2 CHECK
                if (!allowedExtensions.some(ext => path.endsWith(ext))) {
                    return;
                }

                // STAGE 3 CHECK
                const isIncluded =
                    includeFolders.some(folder => path.startsWith(folder)) ||
                    includeFiles.some(file => path.endsWith(file)) ||
                    appRouterUIPattern.test(path);

                if (isIncluded) {
                    selectedFileValues.add(checkbox.value);
                }
            } catch (e) {
                // Ignore errors from unparseable checkbox values
            }
        });

    } else {
        // --- ORIGINAL LOGIC ---
        // If auto-select is OFF, just grab the files that are already checked. This fixes the regression.
        allFileCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedFileValues.add(checkbox.value);
            }
        });
    }

    // Convert the set of JSON strings back to an array of objects
    return Array.from(selectedFileValues).map(fileString => JSON.parse(fileString));
}

// Format repository contents into a single text
function formatRepoContents(contents) {
    let text = '';
    let index = '';

    // Ensure contents is an array before sorting
    contents = Array.isArray(contents) ? contents.sort(sortContents) : [contents];

    // Create a directory tree structure
    const tree = {};
    contents.forEach(item => {
        const parts = item.path.split('/');
        let currentLevel = tree;
        parts.forEach((part, i) => {
            if (!currentLevel[part]) {
                currentLevel[part] = i === parts.length - 1 ? null : {};
            }
            currentLevel = currentLevel[part];
        });
    });

    // Build the index recursively
    function buildIndex(node, prefix = '') {
        let result = '';
        const entries = Object.entries(node);
        entries.forEach(([name, subNode], index) => {
            const isLastItem = index === entries.length - 1;
            const linePrefix = isLastItem ? '└── ' : '├── ';
            const childPrefix = isLastItem ? '    ' : '│   ';

            name = name === '' ? './' : name;

            result += `${prefix}${linePrefix}${name}\n`;
            if (subNode) {
                result += buildIndex(subNode, `${prefix}${childPrefix}`);
            }
        });
        return result;
    }

    index = buildIndex(tree);

    contents.forEach((item) => {
        text += `\n\n---\nFile: ${item.path}\n---\n\n${item.text}\n`;
    });

    const formattedText = `Directory Structure:\n\n${index}\n${text}`;
    try {
        const { encode, decode } = GPTTokenizer_cl100k_base;
        const tokensCount = encode(formattedText).length;
        document.getElementById('tokenCount').innerHTML = `Approximate Token Count: ${tokensCount} <a href="https://github.com/niieani/gpt-tokenizer" target="_blank" class="text-blue-500 hover:text-blue-700 underline">(Using cl100k_base tokenizer)</a>`;
    } catch (error) {
        document.getElementById('tokenCount').innerHTML = '';
        console.log(error);
    }
    return formattedText;
}

export { displayDirectoryStructure, sortContents, getSelectedFiles, formatRepoContents };