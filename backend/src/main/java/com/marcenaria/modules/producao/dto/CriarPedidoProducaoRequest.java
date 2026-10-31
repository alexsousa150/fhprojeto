package com.marcenaria.modules.producao.dto;

import com.marcenaria.domain.enums.OrientacaoVeio;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class CriarPedidoProducaoRequest {

    @NotBlank
    private String nomeCliente;
    private String telefone;

    @NotBlank
    private String nomeMovel; // Ex: "Balcão de Pia 1200mm"
    private String ambiente;  // Ex: "Cozinha"

    private BigDecimal valorTotal;
    private BigDecimal custoMateriais;

    private List<PecaItemRequest> pecas = new ArrayList<>();

    @Data
    public static class PecaItemRequest {
        private String descricao;
        private int quantidade = 1;
        private BigDecimal comprimentoMm;
        private BigDecimal larguraMm;
        private BigDecimal espessuraMm = new BigDecimal("18.00");
        private OrientacaoVeio orientacaoVeio = OrientacaoVeio.LONGITUDINAL;
        private boolean fitaComprimento1;
        private boolean fitaComprimento2;
        private boolean fitaLargura1;
        private boolean fitaLargura2;
        private String chapaInsumoId;
        private String fitaInsumoId;
    }
}
