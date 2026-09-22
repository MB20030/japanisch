param(
    [string]$CsvPath = (Join-Path $PSScriptRoot '..\quizlet_vokabellisten.csv')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $CsvPath)) {
    throw "CSV nicht gefunden: $CsvPath"
}

$firstLine = Get-Content -LiteralPath $CsvPath -Encoding UTF8 -TotalCount 1
if ($firstLine -eq '"Ordner","Lernset","Begriff","Definition","Quizlet-URL"') {
    $rows = @(Import-Csv -LiteralPath $CsvPath -Encoding UTF8)
} else {
    # The earlier partial export wrapped every CSV row in an extra quoted field.
    $cleanLines = @(Get-Content -LiteralPath $CsvPath -Encoding UTF8 | ForEach-Object {
        $line = $_
        if ($line.StartsWith('"') -and $line.EndsWith('";')) {
            $line = $line.Substring(1, $line.Length - 3)
        } elseif ($line.StartsWith('"') -and $line.EndsWith('"')) {
            $line = $line.Substring(1, $line.Length - 2)
        }
        $line.Replace('""', '"').Replace('persönlich";" na-Adjektiv', 'persönlich; na-Adjektiv')
    })
    $rows = @($cleanLines | ConvertFrom-Csv)
}
if ($rows.Count -eq 0) { throw 'Die CSV enthält keine Karten.' }

$required = @('Ordner', 'Lernset', 'Begriff', 'Definition', 'Quizlet-URL')
foreach ($column in $required) {
    if ($column -notin $rows[0].PSObject.Properties.Name) {
        throw "CSV-Spalte fehlt: $column"
    }
}

$sets = New-Object 'System.Collections.Generic.List[object]'
$courseKanji = [ordered]@{}
$excludedSets = 0
$correctedCards = 0

foreach ($group in ($rows | Group-Object -Property 'Quizlet-URL')) {
    $first = $group.Group[0]
    if ($first.Lernset -match '(?i)engl') {
        $excludedSets++
        continue
    }

    $url = ([string]$first.'Quizlet-URL').Split('?')[0]
    $idMatch = [regex]::Match($url, 'quizlet\.com/(?:[a-z]{2}/)?(\d+)')
    if (-not $idMatch.Success) {
        throw "Quizlet-ID nicht gefunden: $url"
    }

    $cards = New-Object 'System.Collections.Generic.List[object]'
    foreach ($row in $group.Group) {
        if (-not $row.Begriff -or -not $row.Definition) {
            throw "Leere Karte in $($first.Lernset)"
        }

        $term = ([string]$row.Begriff).Trim()
        $original = ([string]$row.Definition).Trim()
        $definition = $original
        if ($term -eq '午前') { $definition = 'GOZEN Vormittag (a.m.)' }
        if ($term -eq '午後') { $definition = 'GOGO Nachmittag (p.m.)' }
        if ($term -eq '外国人') { $definition = $definition -replace '^GAIKOKJIN', 'GAIKOKUJIN' }
        if ($definition -ne $original) { $correctedCards++ }

        if ($term.Length -eq 1 -and $term -match '[\u4E00-\u9FFF]' -and -not $courseKanji.Contains($term)) {
            $courseKanji[$term] = $definition
        }

        $cards.Add(@($term, $definition))
    }

    $sets.Add([ordered]@{
        id = $idMatch.Groups[1].Value
        title = [string]$first.Lernset
        folder = [string]$first.Ordner
        url = $url
        cards = $cards.ToArray()
    })
}

$payload = [ordered]@{
    source = [System.IO.Path]::GetFileName($CsvPath)
    generatedAt = (Get-Date).ToString('yyyy-MM-dd')
    sets = $sets.ToArray()
    courseKanji = $courseKanji
}

$json = ConvertTo-Json -InputObject $payload -Depth 8 -Compress
$outputPath = Join-Path $PSScriptRoot 'data.js'
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, "window.JP_DATA = $json;`n", $encoding)

Write-Output ("Sets: {0}; Karten: {1}; Einzelkanji: {2}; gefilterte Sets: {3}; korrigierte Karten: {4}" -f $sets.Count, @($sets | ForEach-Object { $_.cards.Count } | Measure-Object -Sum).Sum, $courseKanji.Count, $excludedSets, $correctedCards)
