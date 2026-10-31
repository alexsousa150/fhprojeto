package com.marcenaria.modules.orcamentos.dto;

import com.marcenaria.domain.enums.TipoInsumo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class NovoInsumoRequest {
    @NotBlank
    private String nome;

    @NotNull
    private TipoInsumo tipo;

    @NotNull
    private BigDecimal custoUnitario;

    private String unidadeMedida;
    private BigDecimal comprimentoMm;
    private BigDecimal larguraMm;
    private BigDecimal espessuraMm;
    private String acabamento;
}
