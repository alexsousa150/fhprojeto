package com.marcenaria.domain.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "login_audits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(name = "ip_origem")
    private String ipOrigem;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(nullable = false)
    private String status; // SUCESSO, SENHA_INVALIDA, BLOQUEADO, MFA_REQUERIDO, MFA_FALHOU

    @Column(name = "registrado_em", nullable = false)
    @Builder.Default
    private LocalDateTime registradoEm = LocalDateTime.now();
}
