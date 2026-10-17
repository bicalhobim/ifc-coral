$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$runtimeNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if ($nodeCommand) { $nodePath = $nodeCommand.Source }
elseif (Test-Path -LiteralPath $runtimeNode) { $nodePath = $runtimeNode }
else { throw 'Node.js não encontrado. Instale o Node.js 24 antes de iniciar.' }
$vitePath = Join-Path $projectRoot 'viewer\node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $vitePath)) { throw 'Dependências ausentes. Em uma cópia independente, execute npm ci dentro de viewer.' }
Write-Host 'IFC Coral: http://127.0.0.1:5178/ — Ctrl+C encerra.'
Push-Location -LiteralPath (Join-Path $projectRoot 'viewer')
try { & $nodePath $vitePath; if ($LASTEXITCODE -ne 0) { throw 'Servidor não iniciou. Confira se a porta 5178 já está em uso.' } }
finally { Pop-Location }
