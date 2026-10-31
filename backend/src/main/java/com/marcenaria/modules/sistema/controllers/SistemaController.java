package com.marcenaria.modules.sistema.controllers;

import com.marcenaria.modules.sistema.dto.AtualizacaoResponseDTO;
import com.marcenaria.modules.sistema.dto.DownloadProgressoDTO;
import com.marcenaria.modules.sistema.dto.IniciarDownloadRequestDTO;
import com.marcenaria.modules.sistema.services.AtualizacaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sistema")
@RequiredArgsConstructor
@Slf4j
public class SistemaController {

    private final AtualizacaoService atualizacaoService;

    @GetMapping("/versao")
    public ResponseEntity<Map<String, Object>> obterVersao() {
        return ResponseEntity.ok(Map.of(
                "versao", atualizacaoService.getVersaoAtual(),
                "sistema", "FH Móveis Planejados - Gestão & Orçamentos",
                "temInternet", atualizacaoService.temConexaoInternet()
        ));
    }

    @GetMapping("/atualizacao/verificar")
    public ResponseEntity<AtualizacaoResponseDTO> verificarAtualizacao() {
        log.info("Requisição para verificar atualizações recebida...");
        AtualizacaoResponseDTO response = atualizacaoService.verificarAtualizacao();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/atualizacao/progresso")
    public ResponseEntity<DownloadProgressoDTO> obterProgressoDownload() {
        return ResponseEntity.ok(atualizacaoService.obterProgressoDownload());
    }

    @PostMapping("/atualizacao/baixar")
    public ResponseEntity<Map<String, Object>> iniciarDownload(@RequestBody IniciarDownloadRequestDTO request) {
        if (request == null || request.getUrlDownload() == null || request.getUrlDownload().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Link de download inválido ou não informado."));
        }
        log.info("Iniciando download da atualização v{} a partir de {}", request.getVersaoNova(), request.getUrlDownload());
        boolean iniciado = atualizacaoService.iniciarDownload(request.getUrlDownload(), request.getVersaoNova());
        if (iniciado) {
            return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", "Download iniciado em segundo plano com backup preventivo dos dados."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Não foi possível iniciar o download. Verifique a conexão com a internet."));
        }
    }

    @PostMapping("/atualizacao/aplicar")
    public ResponseEntity<Map<String, Object>> aplicarAtualizacao() {
        log.info("Solicitação para aplicar atualização recebida. Preparando reinicialização...");
        boolean sucesso = atualizacaoService.aplicarAtualizacaoEReiniciar();
        if (sucesso) {
            return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", "O instalador foi iniciado. O sistema será reiniciado em instantes."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Não foi possível disparar o instalador."));
        }
    }

    @PostMapping("/encerrar")
    public ResponseEntity<Map<String, String>> encerrarSistema() {
        log.info("Solicitação de encerramento manual recebida. Finalizando aplicação...");
        new Thread(() -> {
            try {
                Thread.sleep(600);
                System.exit(0);
            } catch (Exception ignored) {
            }
        }).start();

        return ResponseEntity.ok(Map.of("mensagem", "Sistema encerrado com sucesso. Você pode fechar esta aba."));
    }
}
