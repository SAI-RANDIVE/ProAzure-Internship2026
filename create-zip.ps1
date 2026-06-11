cd 'e:\ProAzure-Internship-2026'

# Get list of files excluding node_modules, dist, and .git
$source = Get-ChildItem -Recurse | Where-Object {
    $path = $_.FullName
    $relPath = $path.Replace('e:\ProAzure-Internship-2026\', '')
    
    # Skip node_modules, dist, .git, and .zip files
    ($relPath -notlike 'node_modules*') -and `
    ($relPath -notlike 'dist*') -and `
    ($relPath -notlike '.git*') -and `
    ($relPath -notlike '*.zip') -and `
    ($relPath -notlike '*.tar.gz')
}

# Create archive
$archivePath = 'e:\ProAzure-Internship-2026-source.zip'
if (Test-Path $archivePath) { Remove-Item $archivePath -Force }

# Get all items to compress
$itemsToCompress = @(
    'src',
    'public',
    'index.html',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    '.env.example',
    '.gitignore',
    'README.md',
    'SETUP.md',
    'DELIVERABLE.md',
    'netlify.toml'
)

Compress-Archive -Path $itemsToCompress -DestinationPath $archivePath -Force

# Show result
$info = Get-Item $archivePath
Write-Host "Created: $($info.Name)"
Write-Host "Size: $([Math]::Round($info.Length/1MB, 2)) MB"
Write-Host "Location: $($info.FullName)"
