# Script tach 4 sheet tu file goc .xlsm ra 4 file .xlsx rieng de test import
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$srcPath = [System.IO.File]::ReadAllText("C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\target_path.txt", [System.Text.Encoding]::UTF8).Trim()
Write-Host "Opening: $srcPath"

try {
    $workbook = $excel.Workbooks.Open($srcPath, 0, $true)
} catch {
    Write-Host "ERROR opening workbook: $_"
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit 1
}

$outDir = "C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\test_data"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$sheetMap = @{
    "Ds_HocSinh"      = "test_DsHocSinh.xlsx"
    "SAOKE_RAW"        = "test_SaoKeVTB.xlsx"
    "SAO_KE_CA_NHAN"   = "test_SaoKeTPB.xlsx"
    "TIEN_MAT"         = "test_TienMat.xlsx"
}

foreach ($entry in $sheetMap.GetEnumerator()) {
    $sheetName = $entry.Key
    $outFile = Join-Path $outDir $entry.Value
    Write-Host "Extracting sheet '$sheetName' -> $outFile"
    
    try {
        $sheet = $workbook.Sheets.Item($sheetName)
        $sheet.Copy()  # creates a new workbook with just this sheet
        $newWb = $excel.ActiveWorkbook
        
        # Save as xlsx (FileFormat 51 = xlOpenXMLWorkbook)
        $newWb.SaveAs($outFile, 51)
        $newWb.Close($false)
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($newWb) | Out-Null
        
        Write-Host "  OK: $outFile"
    } catch {
        Write-Host "  WARNING: Could not extract '$sheetName': $_"
    }
}

# Also extract BAO_CAO for comparison in Phase C
$baoCaoOut = Join-Path $outDir "ref_BaoCao.xlsx"
Write-Host "Extracting sheet 'BAO_CAO' -> $baoCaoOut"
try {
    $sheet = $workbook.Sheets.Item("BAO_CAO")
    $sheet.Copy()
    $newWb = $excel.ActiveWorkbook
    $newWb.SaveAs($baoCaoOut, 51)
    $newWb.Close($false)
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($newWb) | Out-Null
    Write-Host "  OK: $baoCaoOut"
} catch {
    Write-Host "  WARNING: Could not extract BAO_CAO: $_"
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "`nDone! Files saved to: $outDir"
Get-ChildItem $outDir | ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)" }
