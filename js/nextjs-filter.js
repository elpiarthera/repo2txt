// js/nextjs-filter.js

// This function takes a list of all files and returns only the Next.js UI files.
export function filterNextJSFiles(allFiles) {
    // THE RULES:

    // 1. HARD EXCLUSIONS: Anything matching these patterns is IMMEDIATELY REJECTED.
    const excludePatterns = [
        /^\/node_modules\//, /^\/\.next\//, /^\/\.vercel\//, /^\/dist\//, // Build artifacts
        /\/api\//,                  // Any API routes (e.g., /api/, /app/api/)
        /\/route\.(js|ts|jsx|tsx)$/, // ALL Next.js route handlers
        /\/db\//, /\/prisma\//,     // Database folders
        /\/scripts\//,              // Utility scripts
        /\.test\./, /\.spec\./,      // Test files
        /^\/middleware\.(js|ts)$/,  // Middleware file
        /^\/next\.config\./,        // Next.js config
        /^\/drizzle\.config\./,     // Drizzle config
        /^\/sitemap\.(js|ts)$/,      // Sitemap file
        /^\/routes\.(js|ts)$/,      // Custom routes file
        /\.env/, /\.lockb$/,        // Environment and lock files
        /^\.git/, /^\.husky/        // Git and Husky configs
    ];

    // 2. INCLUSIONS: If a file is NOT excluded, it is INCLUDED if it's in one of these folders.
    const includeFolders = [
        '/app/', '/components/', '/ui/', '/styles/', '/theme/', '/design-system/',
        '/assets/', '/public/', '/hooks/', '/lib/', '/utils/', '/config/',
        '/store/', '/types/', '/stubs/'
    ];

    // 3. ALLOWED FILE TYPES: Only include files with these extensions.
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less', '.json', '.svg', '.mdx'];

    const selectedFiles = [];

    for (const fileInfo of allFiles) {
        const path = fileInfo.path;

        // CHECK 1: Is it hard-excluded?
        if (excludePatterns.some(pattern => pattern.test(path))) {
            continue; // Skip this file.
        }

        // CHECK 2: Is it a valid file type?
        if (!allowedExtensions.some(ext => path.endsWith(ext))) {
            continue; // Skip this file.
        }

        // CHECK 3: Is it in an included folder?
        if (includeFolders.some(folder => path.startsWith(folder))) {
            selectedFiles.push(fileInfo); // Success! Add the file.
        }
    }

    return selectedFiles;
}
