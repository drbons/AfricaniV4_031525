/**
 * This script fixes the "next is not recognized" error by ensuring next.js CLI is properly accessible
 * via node_modules/.bin directory and proper command files
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Improve error logging
function logInfo(message) {
  console.log(`[NextFix] ${message}`);
}

function logWarning(message) {
  console.warn(`[NextFix WARNING] ${message}`);
}

function logError(message, error) {
  console.error(`[NextFix ERROR] ${message}`);
  if (error) console.error(error);
}

function logSuccess(message) {
  console.log(`[NextFix SUCCESS] ${message}`);
}

// Check if a command is available
function isCommandAvailable(command) {
  try {
    const result = spawnSync(command, ['--version'], {
      shell: true,
      stdio: 'ignore'
    });
    return result.status === 0;
  } catch (error) {
    return false;
  }
}

// Check environment
function checkEnvironment() {
  logInfo('Checking environment...');
  
  if (!isCommandAvailable('node')) {
    logError('Node.js is not installed or not in PATH. Please install Node.js before continuing.');
    process.exit(1);
  }

  if (!isCommandAvailable('npm')) {
    logError('npm is not installed or not in PATH. Please install npm before continuing.');
    process.exit(1);
  }

  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    logInfo(`Node.js version: ${nodeVersion}`);
    
    // Ensure Node.js version is compatible with Next.js
    const versionNumber = nodeVersion.replace('v', '').split('.').map(Number);
    if (versionNumber[0] < 16) {
      logWarning('Node.js version is below 16. Next.js 13+ recommends Node.js 16 or later.');
    }
  } catch (error) {
    logWarning('Failed to check Node.js version.', error);
  }

  logInfo('Environment check completed.');
}

try {
  // Start with environment check
  checkEnvironment();
  
  // Get absolute path to the project root
  const projectRoot = path.resolve(__dirname);
  logInfo(`Project root: ${projectRoot}`);
  
  // Create .bin directory if it doesn't exist
  const binDir = path.join(projectRoot, 'node_modules', '.bin');
  if (!fs.existsSync(binDir)) {
    logInfo('Creating .bin directory...');
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError(`package.json not found at: ${packageJsonPath}. Are you in the correct directory?`);
    process.exit(1);
  }

  // Check if Next.js is in dependencies
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const hasNextDependency = packageJson.dependencies && packageJson.dependencies.next;
    if (!hasNextDependency) {
      logError('Next.js is not listed in package.json dependencies. Attempting to install Next.js...');
      try {
        execSync('npm install next@13.5.1 --save', { stdio: 'inherit' });
        logInfo('Next.js installed successfully.');
        // Reload package.json after install
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (installError) {
        logError('Failed to install Next.js.', installError);
        process.exit(1);
      }
    } else {
      logInfo(`Next.js version in package.json: ${packageJson.dependencies.next}`);
    }
  } catch (jsonError) {
    logError('Error reading package.json', jsonError);
    process.exit(1);
  }

  // Path to the Next.js CLI
  const nextCliPath = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  
  // Verify Next.js CLI exists
  if (!fs.existsSync(nextCliPath)) {
    logError(`Next.js CLI not found at: ${nextCliPath}. Running npm install to restore dependencies...`);
    try {
      // First, try running npm install to restore all dependencies
      execSync('npm install', { stdio: 'inherit' });
      
      // Check if Next.js was installed
      if (!fs.existsSync(nextCliPath)) {
        // If not, try installing next specifically
        logInfo('Still missing Next.js CLI. Installing Next.js specifically...');
        execSync('npm install next@13.5.1 --save', { stdio: 'inherit' });
      }
      
      // Final check
      if (!fs.existsSync(nextCliPath)) {
        throw new Error('Next.js CLI still not found after installation attempts');
      }
      
      logInfo('Next.js installed successfully.');
    } catch (installError) {
      logError('Failed to install Next.js.', installError);
      logError('Please run "npm install" followed by "npm install next@13.5.1 --save" manually.');
      process.exit(1);
    }
  }

  // Create platform-specific command files
  if (process.platform === 'win32') {
    const nextCmdPath = path.join(binDir, 'next.cmd');
    logInfo('Creating next.cmd file...');
    
    // Create a .cmd file that points to the Next.js CLI
    const cmdContent = `@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%" "%dp0%\\..\\next\\dist\\bin\\next" %*
`;
    
    fs.writeFileSync(nextCmdPath, cmdContent);
    logInfo('Created next.cmd file at: ' + nextCmdPath);
    
    // Also create a .ps1 file for PowerShell
    const nextPs1Path = path.join(binDir, 'next.ps1');
    const ps1Content = `#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux executables exist
  $exe=".exe"
}
$ret=0
if (Test-Path "$basedir/node$exe") {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe" "$basedir/../next/dist/bin/next" $args
  } else {
    & "$basedir/node$exe" "$basedir/../next/dist/bin/next" $args
  }
  $ret=$LASTEXITCODE
} else {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe" "$basedir/../next/dist/bin/next" $args
  } else {
    & "node$exe" "$basedir/../next/dist/bin/next" $args
  }
  $ret=$LASTEXITCODE
}
exit $ret
`;
    fs.writeFileSync(nextPs1Path, ps1Content);
    logInfo('Created next.ps1 file at: ' + nextPs1Path);
    
    // Create batch file directly in the project root for convenience
    const rootNextCmd = path.join(projectRoot, 'next.cmd');
    fs.writeFileSync(rootNextCmd, `@ECHO off
"%~dp0\\node_modules\\.bin\\next.cmd" %*
`);
    logInfo('Created next.cmd in project root for convenience.');
  } else {
    // For Unix-based systems, create a symbolic link
    const nextBinPath = path.join(binDir, 'next');
    logInfo('Creating symbolic link...');
    try {
      if (fs.existsSync(nextBinPath)) {
        fs.unlinkSync(nextBinPath);
      }
      fs.symlinkSync(nextCliPath, nextBinPath);
      execSync(`chmod +x ${nextBinPath}`);
      logInfo('Created symbolic link at: ' + nextBinPath);
      
      // Create shell script in project root for convenience
      const rootNextScript = path.join(projectRoot, 'next');
      fs.writeFileSync(rootNextScript, `#!/bin/sh
"$(dirname "$0")/node_modules/.bin/next" "$@"
`);
      execSync(`chmod +x ${rootNextScript}`);
      logInfo('Created next script in project root for convenience.');
    } catch (error) {
      logError('Error creating symbolic link:', error);
      
      // Fallback to creating a shell script
      try {
        const shellContent = `#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=\`cygpath -w "$basedir"\`;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../next/dist/bin/next" "$@"
else 
  exec node  "$basedir/../next/dist/bin/next" "$@"
fi
`;
        fs.writeFileSync(nextBinPath, shellContent);
        execSync(`chmod +x ${nextBinPath}`);
        logInfo('Created shell script at: ' + nextBinPath);
      } catch (shellError) {
        logError('Error creating shell script:', shellError);
      }
    }
  }

  // Add npx cache entry for next
  try {
    logInfo('Creating npx cache entry for next...');
    const npxCacheDir = path.join(process.env.HOME || process.env.USERPROFILE, '.npm', '_npx');
    if (!fs.existsSync(npxCacheDir)) {
      fs.mkdirSync(npxCacheDir, { recursive: true });
    }
    
    const nextPackage = packageJson.dependencies.next;
    const packageName = `next@${nextPackage.replace('^', '').replace('~', '')}`;
    const npxCachePath = path.join(npxCacheDir, packageName);
    
    // Create a simple JSON file to help npx find the local version
    fs.writeFileSync(
      npxCachePath,
      JSON.stringify({ command: 'next', package: packageName, localPath: path.join(projectRoot, 'node_modules', '.bin', 'next') })
    );
    logInfo(`Added npx cache entry for ${packageName}`);
  } catch (npxError) {
    logWarning('Could not create npx cache entry. This is not critical.', npxError);
  }

  // Verify installation
  try {
    const binExists = fs.existsSync(path.join(binDir, process.platform === 'win32' ? 'next.cmd' : 'next'));
    if (binExists) {
      logSuccess('Next.js CLI fix completed successfully!');
      logSuccess('You can now run Next.js using one of these commands:');
      logSuccess('- npm run dev');
      logSuccess('- npx next');
      if (process.platform === 'win32') {
        logSuccess('- next.cmd');
      } else {
        logSuccess('- ./next');
      }
    } else {
      logError('Next.js CLI fix may have failed. Bin file not found.');
    }
  } catch (verifyError) {
    logError('Error verifying installation:', verifyError);
  }
} catch (error) {
  logError('Unexpected error in fix-next-cli.js:', error);
  process.exit(1);
} 