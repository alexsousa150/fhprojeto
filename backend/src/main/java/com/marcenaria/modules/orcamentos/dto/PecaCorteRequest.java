package com.marcenaria.modules.orcamentos.dto;

import com.marcenaria.domain.enums.OrientacaoVeio;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PecaCorteRequest {
    @NotBlank(message = "Descrição da peça é obrigatória")
    private String descricao;

    @Min(1)
    private int quantidade;

    @NotNull
    private BigDecimal comprimentoMm;

    @NotNull
    private BigDecimal larguraMm;

    @NotNull
    private BigDecimal espessuraMm;

    private OrientacaoVeio orientacaoVeio = OrientacaoVeio.LONGITUDINAL;

    private boolean fitaComprimento1;
    private boolean fitaComprimento2;
    private boolean fitaLargura1;
    private boolean fitaLargura2;

    @NotBlank(message = "Código ou ID da chapa é obrigatório")
    private String chapaInsumoId;

    private String fitaInsumoId;
}
