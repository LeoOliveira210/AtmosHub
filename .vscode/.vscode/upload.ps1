$port = "rfc2217://localhost:4000"

py -m mpremote connect port:$port fs cp firmware/main.py :main.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

py -m mpremote connect port:$port fs cp firmware/bmp180.py :bmp180.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

py -m mpremote connect port:$port fs cp firmware/rain.py :rain.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Arquivos enviados com sucesso!"

Start-Sleep -Seconds 1

py -m mpremote connect port:$port exec "import machine; machine.reset()"