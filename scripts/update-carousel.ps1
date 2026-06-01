$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$carouselDir = Join-Path $root 'assets\Carousel'
$manifestPath = Join-Path $root 'assets\carousel.json'
$allowedExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.gif')

function ConvertTo-Title($name) {
    $withoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($name)
    return ($withoutExtension -replace '[_-]+', ' ' -replace '\s+', ' ').Trim()
}

$slides = Get-ChildItem -Path $carouselDir -File |
    Where-Object { $allowedExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
        $title = ConvertTo-Title $_.Name

        [ordered]@{
            src = "assets/Carousel/$($_.Name)"
            alt = "Realistic Revit render: $title"
            caption = $title
        }
    }

$slides | ConvertTo-Json -Depth 3 | Set-Content -Path $manifestPath -Encoding utf8
Write-Host "Updated assets/carousel.json with $($slides.Count) image(s)."