package com.marcenaria.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email em formato inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String senha;
}
