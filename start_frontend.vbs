Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\mee\Downloads\CargoLink_VF\frontend"
WshShell.Run "cmd /c npm run dev > frontend.log 2>&1", 0, False
