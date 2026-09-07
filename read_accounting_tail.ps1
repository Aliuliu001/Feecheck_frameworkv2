# Script doc CUOI file mau ke toan
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$srcPath = [System.IO.File]::ReadAllText("C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\accounting_path.txt", [System.Text.Encoding]::UTF8).Trim()

try {
    $workbook = $excel.Workbooks.Open($srcPath, 0, $true)
} catch {
    Write-Host "ERROR: $_"
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit 1
}

# Read last rows of each sheet
for ($i = 1; $i -le $workbook.Sheets.Count; $i++) {
    $sheet = $workbook.Sheets.Item($i)
    $usedRange = $sheet.UsedRange
    $totalRows = $usedRange.Rows.Count
    $cols = [Math]::Min($usedRange.Columns.Count, 10)
    
    $startRow = [Math]::Max(1, $totalRows - 5)
    
    Write-Host "`n=== Sheet '$($sheet.Name)' - Total $totalRows rows ==="
    Write-Host "--- Last rows (from row $startRow) ---"
    
    for ($r = $startRow; $r -le $totalRows; $r++) {
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
