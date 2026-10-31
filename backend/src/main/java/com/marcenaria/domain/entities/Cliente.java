package com.marcenaria.domain.entities;

import com.marcenaria.domain.enums.TipoPessoa;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", nullable = false)
    @Builder.Default
    private TipoPessoa tipoPessoa = TipoPessoa.PF;

    @Column(name = "nome_razao_social", nullable = false)
    private String nomeRazaoSocial;

    @Column(name = "cpf_cnpj", unique = true)
    private String cpfCnpj;

    @Column(nullable = false)
    private String telefone;

    private String email;

    @Column(nullable = true)
    private String cep;

    @Column(nullable = true)
    private String logradouro;

    @Column(nullable = true)
    private String numero;

    private String complemento;

    @Column(nullable = true)
    private String bairro;

    @Column(nullable = true)
    private String cidade;

    @Column(nullable = true, length = 2)
    private String uf;

    @Column(name = "criado_em", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();
}
