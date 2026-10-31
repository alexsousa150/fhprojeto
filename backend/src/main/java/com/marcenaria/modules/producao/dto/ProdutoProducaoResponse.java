package com.marcenaria.modules.producao.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProdutoProducaoResponse {
    private UUID id;
    private String nome;
    private String clienteNome;
    private String clienteTelefone;
    private String codigoProjeto;
    private String codigoOP;
    private String ambiente;
    private BigDecimal valorTotal;
    private boolean pronto;
    private LocalDateTime criadoEm;

    @Builder.Default
    private List<PecaProducaoResponse> pecas = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PecaProducaoResponse {
        private UUID id;
        private String descricao;
        private int quantidade;
        private BigDecimal comprimentoMm;
        private BigDecimal larguraMm;
        private BigDecimal espessuraMm;
        private String orientacaoVeio;
        private String fitaResumo;
        private String materialNome;
        private boolean cortada;
        private boolean bordeada;
    }
}
