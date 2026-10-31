package com.marcenaria.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String status; // "SUCCESS" ou "MFA_REQUIRED"
    private String accessToken;
    private String mfaTicket;
    private String nome;
    private String email;
    private String cargo;
    private String mensagem;
}
