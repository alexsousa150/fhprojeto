package com.marcenaria.domain.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "itens_movel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemMovel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambiente_id", nullable = false)
    private Ambiente ambiente;

    @Column(nullable = false)
    private String nome; // Ex: Armário Aéreo 3 Portas, Gaveteiro 4 Gavetas

    private String descricao;

    @Column(nullable = false)
    @Builder.Default
    private int quantidade = 1;

    @Column(name = "horas_producao", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal horasProducao = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean pronto = false;

    @OneToMany(mappedBy = "itemMovel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PecaCorte> pecas = new ArrayList<>();

    @OneToMany(mappedBy = "itemMovel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ItemMovelInsumo> insumosAdicionais = new ArrayList<>();
}
