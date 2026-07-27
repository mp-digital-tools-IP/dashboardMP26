param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,

  [string]$OutputFile = "",

  [string]$Salt = "pk360-local-only"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$anonymizer = Join-Path $scriptDir "anonymize_admissions_data.py"

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Input file not found: $InputFile"
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $inputItem = Get-Item -LiteralPath $InputFile
  $outDir = Join-Path $inputItem.DirectoryName "anonymized"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $OutputFile = Join-Path $outDir ($inputItem.BaseName + "_anonymized" + $inputItem.Extension)
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
  throw "Python is not found. Run this from Codex, or install Python locally."
}

$env:ANONYMIZER_SALT = $Salt
& $python.Source $anonymizer $InputFile -o $OutputFile
