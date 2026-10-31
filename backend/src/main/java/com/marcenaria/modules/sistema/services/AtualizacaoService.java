package com.marcenaria.modules.sistema.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marcenaria.modules.sistema.dto.AtualizacaoResponseDTO;
import com.marcenaria.modules.sistema.dto.DownloadProgressoDTO;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class AtualizacaoService {

    @Getter
    @Value("${app.versao:1.0.1}")
    private String versaoAtual;

    @Value("${app.update.github-repo:alexsousa150/fhprojeto-releases}")
    private String githubRepo;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Reutilização de um único HttpClient singleton para evitar vazamento de threads
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Estado do download em andamento
    private final AtomicBoolean baixando = new AtomicBoolean(false);
    private final AtomicInteger progressoPercentual = new AtomicInteger(0);
    private final AtomicLong bytesBaixados = new AtomicLong(0);
    private final AtomicLong totalBytes = new AtomicLong(0);
    private final AtomicBoolean concluido = new AtomicBoolean(false);
    private volatile String erroDownload = null;
    private volatile Path instaladorBaixado = null;

    /**
     * Testa rapidamente a conectividade real com a internet via TCP/DNS (timeout 2s)
     */
    public boolean temConexaoInternet() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("1.1.1.1", 53), 2000);
            return true;
        } catch (Exception e1) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress("8.8.8.8", 53), 2000);
                return true;
            } catch (Exception e2) {
                return false;
            }
        }
    }

    /**
     * Consulta se existe uma nova versão disponível no repositório de lançamentos
     */
    public AtualizacaoResponseDTO verificarAtualizacao() {
        if (!temConexaoInternet()) {
            return AtualizacaoResponseDTO.builder()
                    .status("SEM_INTERNET")
                    .versaoAtual(versaoAtual)
                    .mensagem("Atenção: Este computador está sem conexão com a internet. Para verificar e baixar atualizações do FH Móveis, certifique-se de que o computador está conectado à rede.")
                    .build();
        }

        try {
            String apiUrl = "https://api.github.com/repos/" + githubRepo + "/releases/latest";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("User-Agent", "FH-Moveis-Gestao-Updater")
                    .header("Accept", "application/vnd.github.v3+json")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 404) {
                return AtualizacaoResponseDTO.builder()
                        .status("ATUALIZADO")
                        .versaoAtual(versaoAtual)
                        .mensagem("Seu sistema já está na versão mais recente (" + versaoAtual + ").")
                        .build();
            }

            if (response.statusCode() != 200) {
                return AtualizacaoResponseDTO.builder()
                        .status("ATUALIZADO")
                        .versaoAtual(versaoAtual)
                        .mensagem("Seu sistema já está operando na versão atual (" + versaoAtual + ").")
                        .build();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String tagName = root.path("tag_name").asText("").trim();
            String versaoLimpa = tagName.replaceAll("^[vV]", "").trim();
            String titulo = root.path("name").asText("Nova Versão " + tagName);
            String novidades = root.path("body").asText("Melhorias e correções no sistema.");

            String urlDownload = null;
            long tamanhoBytes = 0L;
            JsonNode assets = root.path("assets");
            if (assets.isArray()) {
                for (JsonNode asset : assets) {
                    String nome = asset.path("name").asText("").toLowerCase();
                    if (nome.endsWith(".exe") || nome.contains("instalador")) {
                        urlDownload = asset.path("browser_download_url").asText();
                        tamanhoBytes = asset.path("size").asLong(0L);
                        break;
                    }
                }
            }

            if (compararVersoes(versaoLimpa, versaoAtual) > 0) {
                return AtualizacaoResponseDTO.builder()
                        .status("ATUALIZACAO_DISPONIVEL")
                        .versaoAtual(versaoAtual)
                        .versaoNova(versaoLimpa)
                        .titulo(titulo)
                        .novidades(novidades)
                        .tamanhoBytes(tamanhoBytes)
                        .urlDownload(urlDownload)
                        .mensagem("Uma nova versão do sistema está disponível para instalação!")
                        .build();
            } else {
                return AtualizacaoResponseDTO.builder()
                        .status("ATUALIZADO")
                        .versaoAtual(versaoAtual)
                        .mensagem("Seu sistema já está na versão mais recente (" + versaoAtual + ").")
                        .build();
            }

        } catch (Exception e) {
            log.error("Erro ao verificar atualização remota: {}", e.getMessage());
            return AtualizacaoResponseDTO.builder()
                    .status("ERRO")
                    .versaoAtual(versaoAtual)
                    .mensagem("Não foi possível verificar as atualizações no momento: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Retorna o progresso atual do download
     */
    public DownloadProgressoDTO obterProgressoDownload() {
        return DownloadProgressoDTO.builder()
                .baixando(baixando.get())
                .progressoPercentual(progressoPercentual.get())
                .bytesBaixados(bytesBaixados.get())
                .totalBytes(totalBytes.get())
                .concluido(concluido.get())
                .erro(erroDownload)
                .mensagem(baixando.get() ? "Baixando atualização..." : (concluido.get() ? "Download concluído!" : ""))
                .build();
    }

    /**
     * Inicia o download seguro do instalador em segundo plano com backup prévio do banco
     */
    public synchronized boolean iniciarDownload(String urlDownload, String versaoNova) {
        if (baixando.get() || urlDownload == null || urlDownload.isBlank()) {
            return false;
        }

        if (!temConexaoInternet()) {
            erroDownload = "Computador sem conexão com a internet. Conecte-se para baixar a atualização.";
            return false;
        }

        // Blindagem: Backup automático do SQLite antes do download
        fazerBackupBancoDeDados();

        baixando.set(true);
        concluido.set(false);
        progressoPercentual.set(0);
        bytesBaixados.set(0);
        totalBytes.set(0);
        erroDownload = null;
        instaladorBaixado = null;

        CompletableFuture.runAsync(() -> {
            Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
            Path arquivoTemp = tempDir.resolve("FH_Moveis_Update_" + System.currentTimeMillis() + ".download");
            Path arquivoFinal = tempDir.resolve("Instalador_FH_Moveis_v" + (versaoNova != null ? versaoNova : "nova") + ".exe");

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(urlDownload))
                        .header("User-Agent", "FH-Moveis-Gestao-Updater")
                        .GET()
                        .build();

                HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() != 200) {
                    throw new IllegalStateException("Falha no servidor de download: HTTP " + response.statusCode());
                }

                long tamanhoTotal = response.headers().firstValueAsLong("Content-Length").orElse(0L);
                totalBytes.set(tamanhoTotal);

                try (InputStream in = response.body();
                     OutputStream out = Files.newOutputStream(arquivoTemp, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {

                    byte[] buffer = new byte[16384];
                    int bytesLidos;
                    long acumulado = 0;

                    while ((bytesLidos = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesLidos);
                        acumulado += bytesLidos;
                        bytesBaixados.set(acumulado);

                        if (tamanhoTotal > 0) {
                            int pct = (int) ((acumulado * 100) / tamanhoTotal);
                            progressoPercentual.set(Math.min(pct, 99));
                        }
                    }
                }

                Files.move(arquivoTemp, arquivoFinal, StandardCopyOption.REPLACE_EXISTING);
                instaladorBaixado = arquivoFinal;
                progressoPercentual.set(100);
                concluido.set(true);
                baixando.set(false);
                log.info("Download da atualização concluído em: {}", arquivoFinal);

            } catch (Exception e) {
                log.error("Erro durante o download da atualização: {}", e.getMessage());
                erroDownload = "Erro ao baixar atualização: " + e.getMessage();
                baixando.set(false);
                concluido.set(false);
                try {
                    Files.deleteIfExists(arquivoTemp);
                } catch (Exception ignored) {
                }
            }
        });

        return true;
    }

    /**
     * Aplica a atualização: executa o instalador desacoplado e encerra o Java liberando arquivos
     */
    public boolean aplicarAtualizacaoEReiniciar() {
        if (!concluido.get() || instaladorBaixado == null || !Files.exists(instaladorBaixado)) {
            return false;
        }

        try {
            Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
            Path batScript = tempDir.resolve("executar_atualizacao_fh.bat");

            String scriptConteudo = "@echo off\r\n"
                    + "chcp 65001 > nul\r\n"
                    + "timeout /t 1 /nobreak > nul\r\n"
                    + "taskkill /F /IM GestaoMarcenaria.exe >nul 2>&1\r\n"
                    + "taskkill /F /IM javaw.exe >nul 2>&1\r\n"
                    + "timeout /t 1 /nobreak > nul\r\n"
                    + "start \"\" \"" + instaladorBaixado.toAbsolutePath().toString() + "\"\r\n"
                    + "exit\r\n";

            Files.writeString(batScript, scriptConteudo, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            new ProcessBuilder("cmd.exe", "/c", batScript.toAbsolutePath().toString()).start();

            new Thread(() -> {
                try {
                    Thread.sleep(700);
                    System.exit(0);
                } catch (Exception ignored) {
                }
            }).start();

            return true;
        } catch (Exception e) {
            log.error("Erro ao disparar instalador: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Cria cópia de segurança do banco SQLite em ./data/backups/
     */
    public void fazerBackupBancoDeDados() {
        try {
            Path bancoOrigem = Paths.get("data", "marcenaria.db");
            if (!Files.exists(bancoOrigem)) {
                return;
            }

            Path pastaBackup = Paths.get("data", "backups");
            if (!Files.exists(pastaBackup)) {
                Files.createDirectories(pastaBackup);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            Path destinoBackup = pastaBackup.resolve("marcenaria_backup_pre_atualizacao_" + timestamp + ".db");

            Files.copy(bancoOrigem, destinoBackup, StandardCopyOption.REPLACE_EXISTING);
            log.info("Backup preventivo criado em: {}", destinoBackup.toAbsolutePath());

            Path walOrigem = Paths.get("data", "marcenaria.db-wal");
            if (Files.exists(walOrigem)) {
                Files.copy(walOrigem, pastaBackup.resolve("marcenaria_backup_pre_atualizacao_" + timestamp + ".db-wal"), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            log.warn("Aviso ao gerar backup prévio do banco: {}", e.getMessage());
        }
    }

    /**
     * Compara versões semânticas (ex: "1.0.1" com "1.0.0")
     */
    public int compararVersoes(String v1, String v2) {
        if (v1 == null) v1 = "0";
        if (v2 == null) v2 = "0";

        String[] partes1 = v1.replaceAll("^[vV]", "").trim().split("\\.");
        String[] partes2 = v2.replaceAll("^[vV]", "").trim().split("\\.");

        int tamanho = Math.max(partes1.length, partes2.length);

        for (int i = 0; i < tamanho; i++) {
            int num1 = i < partes1.length ? extrairNumero(partes1[i]) : 0;
            int num2 = i < partes2.length ? extrairNumero(partes2[i]) : 0;

            if (num1 != num2) {
                return Integer.compare(num1, num2);
            }
        }
        return 0;
    }

    private int extrairNumero(String parte) {
        try {
            String digitos = parte.replaceAll("[^0-9]", "");
            return digitos.isEmpty() ? 0 : Integer.parseInt(digitos);
        } catch (Exception e) {
            return 0;
        }
    }
}
