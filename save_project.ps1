# Create backup directory with timestamp
$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "D:\Opticore\Africani project\backups\project_backup_$date"
New-Item -ItemType Directory -Path $backupPath -Force

# Save main project files
$projectPath = "D:\Opticore\Africani project\project-bolt-2-cursor-03152025\project"
$directories = @(
    "app",
    "components",
    "lib",
    "hooks",
    "public",
    "styles"
)

# Copy each directory
foreach ($dir in $directories) {
    $sourcePath = Join-Path $projectPath $dir
    $destPath = Join-Path $backupPath $dir
    if (Test-Path $sourcePath) {
        Write-Host "Copying $dir..."
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    }
}

# Copy configuration files
$configFiles = @(
    "package.json",
    "package-lock.json",
    ".env",
    ".babelrc",
    "tailwind.config.js",
    "next.config.js",
    "tsconfig.json",
    "postcss.config.js"
)

foreach ($file in $configFiles) {
    $sourcePath = Join-Path $projectPath $file
    $destPath = Join-Path $backupPath $file
    if (Test-Path $sourcePath) {
        Write-Host "Copying $file..."
        Copy-Item -Path $sourcePath -Destination $destPath -Force
    }
}

# Create a backup info file
$backupInfo = @"
Backup Information:
Date: $date
Project: Africani Project
Version: Development
Components Included:
- Next.js Application
- Firebase Configuration
- Custom Components
- API Routes
- Styles and Assets
"@

$backupInfo | Out-File -FilePath (Join-Path $backupPath "backup_info.txt") -Encoding UTF8

Write-Host "Backup completed successfully at: $backupPath" 