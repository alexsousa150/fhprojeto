package com.marcenaria.modules.orcamentos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ItemMovelRequest {
    @NotBlank(message = "Nome do móvel é obrigatório")
    private String nome;

    private String descricao;

    @Min(1)
    private int quantidade = 1;

    private BigDecimal horasProducao = BigDecimal.ZERO;

    @Valid
    private List<PecaCorteRequest> pecas = new ArrayList<>();

    @Valid
    private List<InsumoAdicionalRequest> insumosAdicionais = new ArrayList<>();

    @Data
    public static class InsumoAdicionalRequest {
        @NotBlank
        private String insumoId;

        @Min(1)
        private BigDecimal quantidade;
    }
}
