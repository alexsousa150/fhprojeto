package com.marcenaria.modules.orcamentos.controllers;

import com.marcenaria.modules.orcamentos.dto.CalcularOrcamentoRequest;
import com.marcenaria.modules.orcamentos.dto.OrcamentoResponse;
import com.marcenaria.modules.orcamentos.services.OrcamentoCalculationService;
import com.marcenaria.modules.producao.services.OrdemProducaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orcamentos")
@RequiredArgsConstructor
public class OrcamentosController {

    private final OrcamentoCalculationService calculationService;
    private final OrdemProducaoService ordemProducaoService;

    @PostMapping("/calcular")
    public ResponseEntity<OrcamentoResponse> calcularOrcamento(
            @Valid @RequestBody CalcularOrcamentoRequest request
    ) {
        return ResponseEntity.ok(calculationService.calcular(request));
    }

    @PostMapping("/projetos/{id}/aprovar-e-gerar-op")
    public ResponseEntity<Map<String, Object>> aprovarProjeto(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> payload
    ) {
        BigDecimal valorFechado = payload.get("valorFechado");
        return ResponseEntity.ok(ordemProducaoService.aprovarProjetoEGerarOP(id, valorFechado));
    }
}
