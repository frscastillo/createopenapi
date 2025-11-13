param()

$ErrorActionPreference = 'Stop'

$root = 'c:\Franco\Proyectos\createopenapi-V1\createopenapi'
$docsRoot = Join-Path $root 'docs'
$docDefinitions = @(
    @{ Source = 'documento-funcional.md'; Target = 'documento-funcional.docx' },
    @{ Source = 'plan-pruebas.md'; Target = 'plan-pruebas.docx' },
    @{ Source = 'documento-tecnico.md'; Target = 'documento-tecnico.docx' },
    @{ Source = 'documento-ux.md'; Target = 'documento-ux.docx' }
)

function Normalize-Line {
    param([string]$Line)
    if ($null -eq $Line) { return '' }
    return $Line.TrimEnd()
}

foreach ($definition in $docDefinitions) {
    $sourcePath = Join-Path $docsRoot $definition.Source
    if (-not (Test-Path $sourcePath)) {
        throw "No se encontro el archivo fuente $($definition.Source) en $docsRoot"
    }
}

try {
    $word = New-Object -ComObject Word.Application
} catch {
    throw 'No se pudo iniciar Microsoft Word. Verifique que este instalado.'
}

try {
    $word.Visible = $false
    $word.DisplayAlerts = 0

    foreach ($definition in $docDefinitions) {
        $sourcePath = Join-Path $docsRoot $definition.Source
        $targetPath = Join-Path $docsRoot $definition.Target

        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Force
        }

        $document = $word.Documents.Add()
        $selection = $word.Selection
        $selection.Style = 'Normal'
        $inCodeBlock = $false

        $lines = Get-Content -LiteralPath $sourcePath
        foreach ($rawLine in $lines) {
            $line = Normalize-Line $rawLine

            if ($line -match '^```') {
                $inCodeBlock = -not $inCodeBlock
                continue
            }

            if ($inCodeBlock) {
                $selection.Style = 'No Spacing'
                $selection.TypeText($line)
                $selection.TypeParagraph()
                $selection.Style = 'Normal'
                continue
            }

            if ([string]::IsNullOrWhiteSpace($line)) {
                $selection.TypeParagraph()
                continue
            }

            $headingMatch = [regex]::Match($line, '^(#{1,6})\s+(.*)$')
            if ($headingMatch.Success) {
                $level = $headingMatch.Groups[1].Value.Length
                $text = $headingMatch.Groups[2].Value.Trim()
                $headingStyle = "Heading $level"
                $selection.Style = $headingStyle
                $selection.TypeText($text)
                $selection.TypeParagraph()
                $selection.Style = 'Normal'
                continue
            }

            $bulletMatch = [regex]::Match($line, '^[-*]\s+(.*)$')
            if ($bulletMatch.Success) {
                $text = '- ' + $bulletMatch.Groups[1].Value.Trim()
                $selection.Style = 'Normal'
                $selection.TypeText($text)
                $selection.TypeParagraph()
                continue
            }

            $numberMatch = [regex]::Match($line, '^(\d+)\.\s+(.*)$')
            if ($numberMatch.Success) {
                $text = $numberMatch.Groups[1].Value + '. ' + $numberMatch.Groups[2].Value.Trim()
                $selection.Style = 'Normal'
                $selection.TypeText($text)
                $selection.TypeParagraph()
                continue
            }

            $selection.Style = 'Normal'
            $selection.TypeText($line)
            $selection.TypeParagraph()
        }

    $format = 12  # wdFormatXMLDocument
    $document.SaveAs($targetPath, $format)
        $document.Close()
        Write-Host "Documento generado: $targetPath"
    }
}
finally {
    if ($word) {
        $word.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Documentos Word generados en $docsRoot"
