$ErrorActionPreference = "SilentlyContinue"
$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(0xa)  # Специальная папка для корзины

$jsFiles = Get-ChildItem -Path "src" -Filter "*.js" -Recurse -File

foreach ($file in $jsFiles) {
    Write-Host "Перемещение в корзину: $($file.FullName)"
    $recycleBin.MoveHere($file.FullName)
    Start-Sleep -Milliseconds 200  # Небольшая задержка для обработки каждого файла
}

Write-Host "Готово! Все .js файлы перемещены в корзину."
