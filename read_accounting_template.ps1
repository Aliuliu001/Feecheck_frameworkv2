# Script doc file mau ke toan
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$srcPath = "D:\Joy\Chương trình SGK\Văn phòng\Lương hàng tháng\Backup Ds Hang Thang Ke Toan\Ds hoc Phi - 07.2026 - Done.xlsx"
# Read path from file to avoid encoding issues
$srcPath = [System.IO.File]::ReadAllText("C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\accounting_path.txt", [System.Text.Encoding]::UTF8).Trim()

Write-Host "Opening: $srcPath"

try {
    $workbook = $excel.Workbooks.Open($srcPath, 0, $true)
} catch {
    Write-Host "ERROR: $_"
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit 1
}

Write-Host "`n=== SHEETS ==="
for ($i = 1; $i -le $workbook.Sheets.Count; $i++) {
    $sheet = $workbook.Sheets.Item($i)
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    Write-Host "Sheet ${i}: '$($sheet.Name)' - $rows rows x $cols cols"
}

# Read each sheet's first 5 rows
for ($i = 1; $i -le $workbook.Sheets.Count; $i++) {
    $sheet = $workbook.Sheets.Item($i)
    $usedRange = $sheet.UsedRange
    $rows = [Math]::Min($usedRange.Rows.Count, 8)
    $cols = [Math]::Min($usedRange.Columns.Count, 15)
    
    Write-Host "`n=== Sheet: '$($sheet.Name)' (first $rows rows, $cols cols) ==="
    
    for ($r = 1; $r -le $rows; $r++) {
        $rowData = @()
        for ($c = 1; $c -le $cols; $c++) {
            $cell = $usedRange.Cells.Item($r, $c)
            $val = $cell.Text
            if ([string]::IsNullOrEmpty($val)) { $val = "" }
            $rowData += $val
        }
        Write-Host "Row ${r}: $($rowData -join ' | ')"
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()
Write-Host "`nDone!"
