package com.marcenaria.modules.sistema.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IniciarDownloadRequestDTO {
    private String urlDownload;
    private String versaoNova;
}
