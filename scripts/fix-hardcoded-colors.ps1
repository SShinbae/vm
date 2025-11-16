# Script to identify files with hardcoded colors that need theme color replacements

$rootPath = "C:\Users\wanah\React Native\vehicles-management"

# Color mappings to replace
$colorMappings = @{
    '#ff4444' = 'colors.error'
    '#F44336' = 'colors.error'
    '#EF4444' = 'colors.error'
    '#4CAF50' = 'colors.success'
    '#10B981' = 'colors.success'
    '#34C759' = 'colors.success'
    '#34D399' = 'colors.success'
    '#FF9800' = 'colors.warning'
    '#F59E0B' = 'colors.warning'
    '#FFA500' = 'colors.warning'
    '#FBBF24' = 'colors.warning'
    '#007AFF' = 'colors.info'
    '#3B82F6' = 'colors.info'
    '#60A5FA' = 'colors.info'
}

# Directories to scan
$directories = @('app', 'components', 'lib')

Write-Host "🔍 Scanning for hardcoded colors..." -ForegroundColor Cyan
Write-Host ""

$fileResults = @{}

foreach ($dir in $directories) {
    $path = Join-Path $rootPath $dir
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Filter *.tsx -Recurse
        
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            $matches = @()
            
            foreach ($color in $colorMappings.Keys) {
                if ($content -match $color) {
                    $matches += $color
                }
            }
            
            if ($matches.Count -gt 0) {
                $fileResults[$file.FullName] = $matches
            }
        }
    }
}

# Display results
Write-Host "📊 Found $($fileResults.Count) files with hardcoded colors:" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $fileResults.Keys | Sort-Object) {
    $relativePath = $file.Replace($rootPath + "\", "")
    Write-Host "  📄 $relativePath" -ForegroundColor White
    foreach ($color in $fileResults[$file]) {
        $replacement = $colorMappings[$color]
        Write-Host "     $color → $replacement" -ForegroundColor Gray
    }
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "✨ Summary:" -ForegroundColor Cyan
Write-Host "  • Total files: $($fileResults.Count)" -ForegroundColor White
Write-Host "  • These colors should be replaced with theme colors" -ForegroundColor White
Write-Host ""
Write-Host "💡 Recommended next steps:" -ForegroundColor Green
Write-Host "  1. Review each file manually" -ForegroundColor White
Write-Host "  2. Replace hardcoded colors with colors.error, colors.success, etc." -ForegroundColor White
Write-Host "  3. Ensure colors object is available from useColorScheme" -ForegroundColor White
Write-Host ""
