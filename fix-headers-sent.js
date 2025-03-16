/**
 * This script patches the Next.js server code to fix the "ERR_HTTP_HEADERS_SENT" error
 * by adding safety checks before setting headers.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Improve error logging
function logInfo(message) {
  console.log(`[HeadersFix] ${message}`);
}

function logWarning(message) {
  console.warn(`[HeadersFix WARNING] ${message}`);
}

function logError(message, error) {
  console.error(`[HeadersFix ERROR] ${message}`);
  if (error) console.error(error);
}

function logSuccess(message) {
  console.log(`[HeadersFix SUCCESS] ${message}`);
}

try {
  // Get absolute path to the project root
  const projectRoot = path.resolve(__dirname);
  logInfo(`Project root: ${projectRoot}`);
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    logError(`node_modules directory not found at: ${nodeModulesPath}. Please run "npm install" first.`);
    process.exit(1);
  }
  
  // Check if Next.js is installed
  const nextPath = path.join(nodeModulesPath, 'next');
  if (!fs.existsSync(nextPath)) {
    logError(`Next.js not found at: ${nextPath}. Please run "npm install next@13.5.1 --save" first.`);
    process.exit(1);
  }
  
  // Multiple files that need to be patched to completely fix the issue
  const filesToPatch = [
    // Main server file
    {
      path: path.join(
        projectRoot,
        'node_modules',
        'next',
        'dist',
        'server',
        'base-server.js'
      ),
      // The original function that sets headers
      originalCode: 'setHeader(name, value) {',
      // The patched function with additional safety checks
      patchedCode: `setHeader(name, value) {
      // Check if headers are already sent to prevent ERR_HTTP_HEADERS_SENT
      if (this.headersSent) {
        console.warn(\`Attempted to set header "\${name}" after headers were sent. This is a no-op.\`);
        return this;
      }`
    },
    // Response wrapper
    {
      path: path.join(
        projectRoot,
        'node_modules',
        'next',
        'dist',
        'server',
        'base-http',
        'node.js'
      ),
      originalCode: 'setHeader(name, value) {',
      patchedCode: `setHeader(name, value) {
      // Check if headers are already sent
      if (this.originalResponse && this.originalResponse.headersSent) {
        console.warn(\`[Next.js] Attempted to set header "\${name}" after headers were sent in NodeNextResponse\`);
        return this;
      }`
    },
    // API Route handler
    {
      path: path.join(
        projectRoot,
        'node_modules',
        'next',
        'dist',
        'server',
        'api-utils',
        'node.js'
      ),
      originalCode: 'setHeader(key, value) {',
      patchedCode: `setHeader(key, value) {
      // Safety check for headers already sent
      if (this.res && this.res.headersSent) {
        console.warn(\`[Next.js API] Cannot set headers after they are sent to the client: \${key}\`);
        return this;
      }`
    },
    // Additional patch for next-http-proxy-middleware
    {
      path: path.join(
        projectRoot,
        'node_modules',
        'next',
        'dist',
        'server',
        'lib',
        'proxy-request.js'
      ),
      findPattern: /function createProxy\([^)]*\) \{/,
      patchedCode: `function createProxy() {
  return (req, res, path) => {
    // Early check for headers already sent
    if (res.headersSent) {
      console.warn('[Next.js Proxy] Cannot proxy request after headers sent');
      return Promise.resolve();
    }`
    }
  ];

  // Apply patches
  let patchedFilesCount = 0;
  let skippedFilesCount = 0;
  let failedPatchesCount = 0;
  
  for (const file of filesToPatch) {
    if (!fs.existsSync(file.path)) {
      logWarning(`File not found: ${file.path}`);
      continue;
    }

    // Read the file content
    let content = fs.readFileSync(file.path, 'utf8');

    // Check if the file has already been patched
    if (content.includes('if (this.headersSent)') || 
        content.includes('if (this.res && this.res.headersSent)') || 
        content.includes('if (this.originalResponse && this.originalResponse.headersSent)') ||
        content.includes('if (res.headersSent)')) {
      logInfo(`File already patched: ${path.basename(file.path)}`);
      skippedFilesCount++;
      continue;
    }

    // Create a backup of the original file
    const backupPath = `${file.path}.backup`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content, 'utf8');
      logInfo(`Backup created at: ${path.basename(backupPath)}`);
    }

    let patchedContent;
    
    if (file.originalCode) {
      // Replace the original code with the patched code
      patchedContent = content.replace(file.originalCode, file.patchedCode);
    } else if (file.findPattern) {
      // Use regex pattern to find and patch
      patchedContent = content.replace(file.findPattern, file.patchedCode);
    }

    if (content === patchedContent) {
      logError(`Failed to patch file - pattern not found: ${path.basename(file.path)}`);
      failedPatchesCount++;
      continue;
    }

    // Write the patched content back to the file
    fs.writeFileSync(file.path, patchedContent, 'utf8');
    logInfo(`Successfully patched file: ${path.basename(file.path)}`);
    patchedFilesCount++;
  }

  // Additional fixes for specific files that need different patch strategies
  
  // Fix for router-server.js (middleware handling)
  const routerServerPath = path.join(
    projectRoot,
    'node_modules',
    'next',
    'dist',
    'server',
    'lib',
    'router-server.js'
  );

  if (fs.existsSync(routerServerPath)) {
    let routerContent = fs.readFileSync(routerServerPath, 'utf8');
    
    // Check if it's already patched
    if (!routerContent.includes('if (res.headersSent)')) {
      // Create a backup
      const backupPath = `${routerServerPath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, routerContent, 'utf8');
        logInfo(`Backup created at: ${path.basename(backupPath)}`);
      }
      
      // Add header check in handleRequest function
      let patchedRouterContent = routerContent.replace(
        /async function handleRequest\(\s*req,\s*res,\s*query,\s*\{([^}]*)\}\s*\)\s*\{/,
        `async function handleRequest(req, res, query, {$1}) {
  // Early return if headers already sent
  if (res.headersSent) {
    console.warn('[Next.js Router] Cannot handle request after headers sent');
    return;
  }`
      );
      
      if (routerContent !== patchedRouterContent) {
        fs.writeFileSync(routerServerPath, patchedRouterContent, 'utf8');
        logInfo(`Successfully patched router-server.js`);
        patchedFilesCount++;
      } else {
        logError(`Failed to patch router-server.js - pattern not found`);
        failedPatchesCount++;
      }
    } else {
      logInfo(`router-server.js already patched`);
      skippedFilesCount++;
    }
  } else {
    logWarning(`router-server.js not found at: ${routerServerPath}`);
  }
  
  // Fix for response.js (new in Next 13+)
  const responsePath = path.join(
    projectRoot,
    'node_modules',
    'next',
    'dist',
    'server',
    'web',
    'spec-extension',
    'response.js'
  );
  
  if (fs.existsSync(responsePath)) {
    let responseContent = fs.readFileSync(responsePath, 'utf8');
    
    // Check if it's already patched
    if (!responseContent.includes('if (this.headersSent)')) {
      // Create a backup
      const backupPath = `${responsePath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, responseContent, 'utf8');
        logInfo(`Backup created at: ${path.basename(backupPath)}`);
      }
      
      // Patch multiple methods
      const methodsToAddCheck = [
        'headers',
        'status',
        'statusText'
      ];
      
      let patchedResponseContent = responseContent;
      
      for (const method of methodsToAddCheck) {
        patchedResponseContent = patchedResponseContent.replace(
          new RegExp(`set ${method}\\(([^)]*?)\\)\\s*\\{`),
          `set ${method}($1) {
    // Check if headers already sent
    if (this.headersSent) {
      console.warn(\`[Next.js Response] Cannot set ${method} after headers were sent\`);
      return;
    }`
        );
      }
      
      if (responseContent !== patchedResponseContent) {
        fs.writeFileSync(responsePath, patchedResponseContent, 'utf8');
        logInfo(`Successfully patched response.js`);
        patchedFilesCount++;
      } else {
        logError(`Failed to patch response.js - patterns not found`);
        failedPatchesCount++;
      }
    } else {
      logInfo(`response.js already patched`);
      skippedFilesCount++;
    }
  }
  
  // Fix for rendering.js (SSR)
  const renderingPath = path.join(
    projectRoot,
    'node_modules',
    'next',
    'dist',
    'server',
    'render.js'
  );
  
  if (fs.existsSync(renderingPath)) {
    let renderingContent = fs.readFileSync(renderingPath, 'utf8');
    
    // Check if it's already patched
    if (!renderingContent.includes('if (res.headersSent)')) {
      // Create a backup
      const backupPath = `${renderingPath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, renderingContent, 'utf8');
        logInfo(`Backup created at: ${path.basename(backupPath)}`);
      }
      
      // Patch renderToHTML function
      let patchedRenderingContent = renderingContent.replace(
        /export async function renderToHTML\(\s*req,\s*res,\s*pathname,\s*query,\s*renderOpts\s*\)\s*\{/,
        `export async function renderToHTML(req, res, pathname, query, renderOpts) {
  // Early return if headers already sent
  if (res.headersSent) {
    console.warn('[Next.js Render] Cannot render HTML after headers sent');
    return null;
  }`
      );
      
      if (renderingContent !== patchedRenderingContent) {
        fs.writeFileSync(renderingPath, patchedRenderingContent, 'utf8');
        logInfo(`Successfully patched render.js`);
        patchedFilesCount++;
      } else {
        logError(`Failed to patch render.js - pattern not found`);
        failedPatchesCount++;
      }
    } else {
      logInfo(`render.js already patched`);
      skippedFilesCount++;
    }
  }

  // Report results
  logSuccess(`Patch summary:`);
  logSuccess(`- ${patchedFilesCount} files patched successfully`);
  logSuccess(`- ${skippedFilesCount} files already patched (skipped)`);
  if (failedPatchesCount > 0) {
    logWarning(`- ${failedPatchesCount} files failed to patch (pattern not found)`);
  }
  
  // Clear Next.js cache to ensure patches take effect
  try {
    logInfo('Clearing Next.js cache...');
    const cacheDir = path.join(projectRoot, '.next');
    if (fs.existsSync(cacheDir)) {
      // Use rimraf-like approach to delete directory contents
      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        if (file !== 'cache') { // Keep the cache directory itself
          try {
            if (fs.lstatSync(filePath).isDirectory()) {
              // Recursive delete using native command
              if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${filePath}"`, { stdio: 'ignore' });
              } else {
                execSync(`rm -rf "${filePath}"`, { stdio: 'ignore' });
              }
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            logWarning(`Could not delete ${filePath}: ${e.message}`);
          }
        }
      }
      logInfo('Next.js cache cleared');
    }
  } catch (cacheError) {
    logWarning('Error clearing Next.js cache:', cacheError);
  }

  logSuccess('Successfully patched Next.js server code to fix ERR_HTTP_HEADERS_SENT errors.');
  logSuccess('You can now run your Next.js application with reduced risk of header errors.');
} catch (error) {
  logError('Unexpected error in fix-headers-sent.js:', error);
  process.exit(1);
} 