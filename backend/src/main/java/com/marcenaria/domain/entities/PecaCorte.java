package com.marcenaria.domain.entities;

import com.marcenaria.domain.enums.OrientacaoVeio;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "pecas_corte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PecaCorte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_movel_id", nullable = false)
    private ItemMovel itemMovel;

    @Column(nullable = false)
    private String descricao; // Ex: Lateral Direita, Tampo, Prateleira

    @Column(nullable = false)
    @Builder.Default
    private int quantidade = 1;

    // Dimensões em milímetros
    @Column(name = "comprimento_mm", nullable = false, precision = 8, scale = 2)
    private BigDecimal comprimentoMm;

    @Column(name = "largura_mm", nullable = false, precision = 8, scale = 2)
    private BigDecimal larguraMm;

    @Column(name = "espessura_mm", nullable = false, precision = 6, scale = 2)
    private BigDecimal espessuraMm;

    @Enumerated(EnumType.STRING)
    @Column(name = "orientacao_veio", nullable = false)
    @Builder.Default
    private OrientacaoVeio orientacaoVeio = OrientacaoVeio.LONGITUDINAL;

    // Fitas de Borda nas 4 arestas (C1, C2, L1, L2)
    @Column(name = "fita_comprimento_1", nullable = false)
    @Builder.Default
    private boolean fitaComprimento1 = false;

    @Column(name = "fita_comprimento_2", nullable = false)
    @Builder.Default
    private boolean fitaComprimento2 = false;

    @Column(name = "fita_largura_1", nullable = false)
    @Builder.Default
    private boolean fitaLargura1 = false;

    @Column(name = "fita_largura_2", nullable = false)
    @Builder.Default
    private boolean fitaLargura2 = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapa_insumo_id", nullable = false)
    private Insumo chapaInsumo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fita_insumo_id")
    private Insumo fitaInsumo;

    @Column(nullable = false)
    @Builder.Default
    private boolean cortada = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean bordeada = false;
}
