$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$sourcePath = Join-Path $root 'videos.txt'
$manifestPath = Join-Path $root 'assets\videos.json'

function Get-YouTubeId($url) {
    $patterns = @(
        'youtu\.be/([^?&/]+)',
        'youtube\.com/watch\?v=([^?&/]+)',
        'youtube\.com/embed/([^?&/]+)',
        'youtube\.com/shorts/([^?&/]+)'
    )

    foreach ($pattern in $patterns) {
        $match = [regex]::Match($url, $pattern)
        if ($match.Success) {
            return $match.Groups[1].Value
        }
    }

    throw "Could not find a YouTube video ID in: $url"
}

function ConvertTo-Slug($value) {
    $slug = $value.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    return ($slug -replace '(^-|-$)', '')
}

function Format-FileSize($bytes) {
    if ($bytes -ge 1MB) {
        return "{0:N1} MB" -f ($bytes / 1MB)
    }

    if ($bytes -ge 1KB) {
        return "{0:N0} KB" -f ($bytes / 1KB)
    }

    return "$bytes B"
}

$videos = @()
$lineNumber = 0

foreach ($line in Get-Content -Path $sourcePath) {
    $lineNumber++
    $trimmed = $line.Trim()

    if (-not $trimmed -or $trimmed.StartsWith('#')) {
        continue
    }

    $parts = $trimmed -split '\s*\|\s*', 5

    if ($parts.Count -lt 3) {
        throw "videos.txt line $lineNumber needs at least: YouTube URL | Heading | Description"
    }

    $url = $parts[0].Trim()
    $title = $parts[1].Trim()
    $description = $parts[2].Trim()
    $slug = ConvertTo-Slug $title

    $video = [ordered]@{
        videoId = Get-YouTubeId $url
        youtubeUrl = "https://youtu.be/$(Get-YouTubeId $url)"
        slug = $slug
        title = $title
        description = $description
    }

    if ($parts.Count -ge 5 -and $parts[3].Trim() -and $parts[4].Trim()) {
        $video.linkLabel = $parts[3].Trim()
        $video.linkUrl = $parts[4].Trim()

        if ($video.linkUrl.StartsWith('assets/Families/')) {
            $downloadPath = Join-Path $root $video.linkUrl

            if (Test-Path $downloadPath) {
                $downloadFile = Get-Item $downloadPath
                $video.linkFileName = $downloadFile.Name
                $video.linkFileSize = Format-FileSize $downloadFile.Length
            }
        }
    }

    $videos += $video
}

$videos | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding utf8
Write-Host "Updated assets/videos.json with $($videos.Count) video(s)."