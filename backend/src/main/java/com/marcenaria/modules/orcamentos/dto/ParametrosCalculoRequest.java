package com.marcenaria.modules.orcamentos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ParametrosCalculoRequest {
    @NotNull
    private BigDecimal percentualPerca = new BigDecimal("15.00"); // % de Perca/Desperdício

    @NotNull
    private BigDecimal multiplicadorMateriais = new BigDecimal("3.00"); // Ex: 3.0x o custo dos materiais

    private BigDecimal taxaHoraHomem = BigDecimal.ZERO;
    private BigDecimal custoFixoRateio = BigDecimal.ZERO;
}
