package com.marcenaria.modules.orcamentos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CalcularOrcamentoRequest {
    @NotNull
    @Valid
    private ParametrosCalculoRequest parametros = new ParametrosCalculoRequest();

    @Valid
    private List<AmbienteRequest> ambientes = new ArrayList<>();
}
