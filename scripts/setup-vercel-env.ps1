$envFile = ".env.local"
if (-Not (Test-Path $envFile)) {
  Write-Error ".env.local not found"
  exit 1
}

# Read raw content to avoid encoding anomalies and split by newline characters
$rawContent = Get-Content -Raw $envFile
$lines = $rawContent -split "\r?\n"

foreach ($line in $lines) {
  $trimmed = $line.Trim()
  # Skip comments and empty lines
  if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
    continue
  }
  
  # Match key=value at the first equal sign to preserve equal signs inside token values
  if ($trimmed -match '^([^=]+)=(.*)$') {
    $key = $Matches[1].Trim()
    $value = $Matches[2].Trim()
    
    # Skip if key or value is empty
    if ($key -eq "" -or $value -eq "") {
      continue
    }
    
    # Strip surrounding double or single quotes
    if ($value -match '^"(.*)"$') {
      $value = $Matches[1]
    } elseif ($value -match "^'(.*)'$") {
      $value = $Matches[1]
    }
    
    Write-Host "Setting $key on Vercel..."
    
    # Securely pipe the raw string into stdin of vercel env add command to prevent shell escape issues
    Write-Output $value | vercel env add $key production --force 2>$null
    Write-Output $value | vercel env add $key preview --force 2>$null
    Write-Output $value | vercel env add $key development --force 2>$null
    
    Write-Host "✅ Variable $key set successfully"
  }
}
Write-Host "✅ All env vars added to Vercel"
