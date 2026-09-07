# Count actual data rows in each sheet
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$srcPath = [System.IO.File]::ReadAllText("C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\accounting_path.txt", [System.Text.Encoding]::UTF8).Trim()
$workbook = $excel.Workbooks.Open($srcPath, 0, $true)

# Sheet 1 - count non-empty rows in col B (Ma hoc sinh)
$s1 = $workbook.Sheets.Item(1)
$usedRange1 = $s1.UsedRange
$count1 = 0
for ($r = 2; $r -le $usedRange1.Rows.Count; $r++) {
    $val = $usedRange1.Cells.Item($r, 2).Text
    if (-not [string]::IsNullOrWhiteSpace($val)) { $count1++ }
}
Write-Host "Sheet 1 'Thuc Te': $count1 students (data rows with MSHS)"

# Check last 3 data rows
Write-Host "--- Last data rows of Sheet 1 ---"
$lastFound = 0
for ($r = $usedRange1.Rows.Count; $r -ge 2; $r--) {
    $val = $usedRange1.Cells.Item($r, 2).Text
    if (-not [string]::IsNullOrWhiteSpace($val)) {
        $lastFound = $r
        break
    }
}
for ($r = [Math]::Max(2, $lastFound - 2); $r -le $lastFound; $r++) {
    $rowData = @()
    for ($c = 1; $c -le 8; $c++) {
        $rowData += $usedRange1.Cells.Item($r, $c).Text
    }
    Write-Host "Row ${r}: $($rowData -join ' | ')"
}

# Sheet 2 - count non-empty rows in col B starting from row 8
$s2 = $workbook.Sheets.Item(2)
$usedRange2 = $s2.UsedRange
$count2 = 0
for ($r = 8; $r -le $usedRange2.Rows.Count; $r++) {
    $val = $usedRange2.Cells.Item($r, 2).Text
    if (-not [string]::IsNullOrWhiteSpace($val)) { $count2++ }
}
Write-Host "`nSheet 2 'DS Viet HD': $count2 students (data rows with MSHS, from row 8)"

# Check last 3 data rows
Write-Host "--- Last data rows of Sheet 2 ---"
$lastFound2 = 0
for ($r = $usedRange2.Rows.Count; $r -ge 8; $r--) {
    $val = $usedRange2.Cells.Item($r, 2).Text
    if (-not [string]::IsNullOrWhiteSpace($val)) {
        $lastFound2 = $r
        break
    }
}
for ($r = [Math]::Max(8, $lastFound2 - 2); $r -le $lastFound2; $r++) {
    $rowData = @()
    for ($c = 1; $c -le 8; $c++) {
        $rowData += $usedRange2.Cells.Item($r, $c).Text
    }
    Write-Host "Row ${r}: $($rowData -join ' | ')"
}

# Check for the total row right after data in sheet 2
Write-Host "`n--- Row after last data in Sheet 2 ---"
for ($r = $lastFound2 + 1; $r -le [Math]::Min($lastFound2 + 3, $usedRange2.Rows.Count); $r++) {
    $rowData = @()
    for ($c = 1; $c -le 8; $c++) {
        $rowData += $usedRange2.Cells.Item($r, $c).Text
    }
    Write-Host "Row ${r}: $($rowData -join ' | ')"
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
Write-Host "`nDone!"
