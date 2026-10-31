; Script Inno Setup para FH Móveis Planejados - Gestão & Orçamentos
#define MyAppName "FH Móveis - Gestão"
#ifndef MyAppVersion
  #define MyAppVersion "1.0.1"
#endif
#define MyAppPublisher "FH Móveis Planejados"
#define MyAppURL "http://localhost:8085"
#define MyAppExeName "GestaoMarcenaria.exe"

[Setup]
AppId={{9F82A4C1-4D88-4F1E-9C6E-5A1D4E89B2F0}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\GestaoMarcenaria
DefaultGroupName={#MyAppPublisher}
AllowNoIcons=yes
OutputDir=dist-installer
OutputBaseFilename=Instalador_FH_Moveis_Gestao_v{#MyAppVersion}
SetupIconFile=app.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\app.ico
DisableProgramGroupPage=yes
PrivilegesRequired=admin
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startup"; Description: "Iniciar o sistema automaticamente junto com o Windows"; GroupDescription: "Inicialização:"; Flags: unchecked

[Files]
; Arquivos do sistema (Java 21 embutido, executável e recursos)
Source: "dist-app\GestaoMarcenaria\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "data\marcenaria.db*,data\backups\*"

; O banco de dados SQLite nunca é sobrescrito nem apagado em atualizações/reinstalações
Source: "dist-app\GestaoMarcenaria\data\*"; DestDir: "{app}\data"; Flags: onlyifdoesntexist uninsneveruninstall recursesubdirs createallsubdirs; Excludes: "data\backups\*"
Source: "app.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Atalho no Menu Iniciar
Name: "{autoprograms}\{#MyAppPublisher}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\Iniciar-Silencioso.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"
Name: "{autoprograms}\{#MyAppPublisher}\Encerrar Sistema"; Filename: "{app}\fechar.bat"; WorkingDir: "{app}"
Name: "{autoprograms}\{#MyAppPublisher}\Pasta do Banco de Dados (Backup)"; Filename: "{app}\data"; WorkingDir: "{app}"
Name: "{autoprograms}\{#MyAppPublisher}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

; Atalho na Área de Trabalho
Name: "{autodesktop}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\Iniciar-Silencioso.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

; Inicialização com o Windows (se o usuário marcar a opção)
Name: "{commonstartup}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\Iniciar-Silencioso.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"; Tasks: startup

[Run]
Filename: "wscript.exe"; Parameters: """{app}\Iniciar-Silencioso.vbs"""; WorkingDir: "{app}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
