package com.marcenaria.modules.orcamentos.controllers;

import com.marcenaria.domain.entities.Insumo;
import com.marcenaria.domain.enums.TipoInsumo;
import com.marcenaria.domain.repositories.InsumoRepository;
import com.marcenaria.modules.orcamentos.dto.NovoInsumoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insumos")
@RequiredArgsConstructor
public class InsumosController {

    private final InsumoRepository insumoRepository;

    @GetMapping
    public ResponseEntity<List<Insumo>> listarTodos() {
        return ResponseEntity.ok(insumoRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Insumo> cadastrar(@Valid @RequestBody NovoInsumoRequest request) {
        String baseCodigo = normalizarCodigo(request.getNome());
        String codigoFinal = baseCodigo;
        int contador = 1;
        while (insumoRepository.findByCodigo(codigoFinal).isPresent()) {
            codigoFinal = baseCodigo + "-" + contador++;
        }

        String unidade = request.getUnidadeMedida();
        if (unidade == null || unidade.isBlank()) {
            unidade = request.getTipo() == TipoInsumo.FITA_BORDA ? "M" : "UN";
        }

        BigDecimal comp = request.getComprimentoMm();
        BigDecimal larg = request.getLarguraMm();
        BigDecimal esp = request.getEspessuraMm();
        if (request.getTipo() == TipoInsumo.CHAPA) {
            if (comp == null) comp = new BigDecimal("2750.00");
            if (larg == null) larg = new BigDecimal("1850.00");
            if (esp == null) esp = new BigDecimal("18.00");
        }

        Insumo insumo = Insumo.builder()
                .codigo(codigoFinal)
                .nome(request.getNome())
                .tipo(request.getTipo())
                .custoUnitario(request.getCustoUnitario())
                .unidadeMedida(unidade)
                .comprimentoMm(comp)
                .larguraMm(larg)
                .espessuraMm(esp)
                .acabamento(request.getAcabamento())
                .estoqueAtual(BigDecimal.TEN)
                .estoqueMinimo(BigDecimal.ONE)
                .build();

        return ResponseEntity.ok(insumoRepository.save(insumo));
    }

    private String normalizarCodigo(String texto) {
        if (texto == null || texto.isBlank()) {
            return "mat-" + UUID.randomUUID().toString().substring(0, 6);
        }
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        return semAcento.isBlank() ? "mat-" + UUID.randomUUID().toString().substring(0, 6) : semAcento;
    }
}
