package com.marcenaria.modules.auth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequest {
    @NotBlank(message = "O ticket MFA é obrigatório")
    private String mfaTicket;

    @Min(value = 100000, message = "O código TOTP deve ter 6 dígitos")
    @Max(value = 999999, message = "O código TOTP deve ter 6 dígitos")
    private int codigoTotp;
}
