package com.marcenaria.modules.sistema.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadProgressoDTO {
    private boolean baixando;
    private int progressoPercentual;
    private long bytesBaixados;
    private long totalBytes;
    private boolean concluido;
    private String erro;
    private String mensagem;
}
