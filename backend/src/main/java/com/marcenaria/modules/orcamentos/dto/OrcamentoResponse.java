package com.marcenaria.modules.orcamentos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrcamentoResponse {

    private ResumoConsumo resumoConsumo;
    private TotaisOrcamento totais;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumoConsumo {
        private List<ConsumoChapa> chapas;
        private List<ConsumoFita> fitasBorda;
        private List<ConsumoFerragem> ferragensEInsumos;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsumoChapa {
        private String insumoId;
        private String nome;
        private BigDecimal areaLiquidaM2;
        private BigDecimal areaComDesperdicioM2;
        private BigDecimal areaChapaPadraoM2;
        private int estimativaChapasInteiras;
        private BigDecimal custoUnitario;
        private BigDecimal custoTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsumoFita {
        private String insumoId;
        private String nome;
        private BigDecimal metrosLinearesLiquidos;
        private BigDecimal metrosLinearesComPerda;
        private BigDecimal custoUnitarioMetro;
        private BigDecimal custoTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsumoFerragem {
        private String insumoId;
        private String nome;
        private BigDecimal quantidadeTotal;
        private String unidadeMedida;
        private BigDecimal custoUnitario;
        private BigDecimal custoTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TotaisOrcamento {
        private int totalChapasInteiras;
        private BigDecimal custoTotalChapas;
        private BigDecimal custoTotalFitas;
        private BigDecimal custoTotalFerragens;
        private BigDecimal custoTotalMateriais; // Base do multiplicador
        private BigDecimal multiplicadorMateriais; // Ex: 3.0x
        private BigDecimal valorVendaSugerido; // Custo Materiais * Multiplicador
        private BigDecimal valorEntradaSinal50; // 50% de entrada no fechamento
        private BigDecimal valorEntregaFinal50; // 50% na entrega
        private BigDecimal lucroBrutoEstimado;
    }
}
