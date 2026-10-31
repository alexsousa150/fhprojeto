package com.marcenaria.modules.sistema.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtualizacaoResponseDTO {
    /**
     * Status possíveis:
     * - "SEM_INTERNET": Computador sem acesso à internet
     * - "ATUALIZADO": Sistema já está na versão mais recente
     * - "ATUALIZACAO_DISPONIVEL": Nova versão encontrada e pronta para baixar
     * - "ERRO": Falha ao consultar o servidor de atualizações
     */
    private String status;
    private String versaoAtual;
    private String versaoNova;
    private String titulo;
    private String novidades;
    private Long tamanhoBytes;
    private String urlDownload;
    private String mensagem;
}
