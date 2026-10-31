package com.marcenaria.modules.orcamentos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AmbienteRequest {
    @NotBlank(message = "Nome do ambiente é obrigatório")
    private String nome;

    private String observacoes;

    @Valid
    private List<ItemMovelRequest> itens = new ArrayList<>();
}
