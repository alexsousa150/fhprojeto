Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

If fso.FileExists(currentDir & "\GestaoMarcenaria.exe") Then
    appDir = currentDir
ElseIf fso.FileExists(currentDir & "\dist-app\GestaoMarcenaria\GestaoMarcenaria.exe") Then
    appDir = currentDir & "\dist-app\GestaoMarcenaria"
Else
    appDir = currentDir
End If

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = appDir
WshShell.Run "GestaoMarcenaria.exe", 0, False
