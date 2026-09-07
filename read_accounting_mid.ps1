# Script doc giua file mau ke toan - rows 155 to 167 for sheet 1, rows 7 to 15 + rows 100-110 + 140-160 for sheet 2
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

function ReadRows($sheet, $from, $to, $cols) {
    $usedRange = $sheet.UsedRange
    for ($r = $from; $r -le $to; $r++) {
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

# Sheet 1 - last data rows
$s1 = $workbook.Sheets.Item(1)
Write-Host "`n=== Sheet 1 'Thuc Te' rows 155-167 ==="
ReadRows $s1 155 167 8

# Sheet 2 - header area + middle + end
$s2 = $workbook.Sheets.Item(2)
Write-Host "`n=== Sheet 2 'DS Viet HD' rows 1-10 ==="
ReadRows $s2 1 10 8

Write-Host "`n=== Sheet 2 rows 140-160 ==="
ReadRows $s2 140 160 8

Write-Host "`n=== Sheet 2 rows 175-195 ==="
ReadRows $s2 175 195 8

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()
Write-Host "`nDone!"
