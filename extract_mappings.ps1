$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbookPath = [System.IO.File]::ReadAllText("C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\target_path.txt", [System.Text.Encoding]::UTF8).Trim()
Write-Host "Opening workbook $workbookPath..."
try {
    $workbook = $excel.Workbooks.Open($workbookPath, 0, $true) # open read-only
} catch {
    Write-Host "Error opening workbook: $_"
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit 1
}

# STK_PHU
$stkPhuData = @()
try {
    $sheetStk = $workbook.Sheets.Item("STK_PHU")
    $usedRange = $sheetStk.UsedRange
    $rows = $usedRange.Rows.Count
    
    # Assuming Header is Row 1: Full name, MSHS, STK_PH, TênTK
    for ($i = 2; $i -le $rows; $i++) {
        $fullName = $sheetStk.Cells.Item($i, 1).Text
        $mshs = $sheetStk.Cells.Item($i, 2).Text
        $stk = $sheetStk.Cells.Item($i, 3).Text
        $tenTK = $sheetStk.Cells.Item($i, 4).Text
        
        if (-not [string]::IsNullOrWhiteSpace($stk) -and -not [string]::IsNullOrWhiteSpace($mshs)) {
            $stkPhuData += @{
                fullName = $fullName
                mshs = $mshs
                stk = $stk -replace '[\s\.\-]', ''
                tenTK = $tenTK
            }
        }
    }
    Write-Host "Extracted $($stkPhuData.Count) rows from STK_PHU"
} catch {
    Write-Host "Warning: STK_PHU not found or error reading it: $_"
}

# MAP_TU_KHOA
$mapTuKhoaData = @()
try {
    $sheetMap = $workbook.Sheets.Item("MAP_TU_KHOA")
    $usedRange = $sheetMap.UsedRange
    $rows = $usedRange.Rows.Count
    
    # Assuming Header is Row 1: TU_KHOA, MSHS, Student
    for ($i = 2; $i -le $rows; $i++) {
        $tuKhoa = $sheetMap.Cells.Item($i, 1).Text
        $mshs = $sheetMap.Cells.Item($i, 2).Text
        $student = $sheetMap.Cells.Item($i, 3).Text
        
        if (-not [string]::IsNullOrWhiteSpace($tuKhoa) -and -not [string]::IsNullOrWhiteSpace($mshs)) {
            $mapTuKhoaData += @{
                keyword = $tuKhoa
                mshs = $mshs
                studentName = $student
            }
        }
    }
    Write-Host "Extracted $($mapTuKhoaData.Count) rows from MAP_TU_KHOA"
} catch {
    Write-Host "Warning: MAP_TU_KHOA not found or error reading it: $_"
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

$result = @{
    joy_stk_phu = $stkPhuData
    joy_keywords = $mapTuKhoaData
}

$jsonPath = "C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\shared_data\joy_mappings.json"
$dir = [System.IO.Path]::GetDirectoryName($jsonPath)
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$result | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Exported mappings to $jsonPath"
