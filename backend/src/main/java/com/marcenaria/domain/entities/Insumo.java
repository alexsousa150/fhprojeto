package com.marcenaria.domain.entities;

import com.marcenaria.domain.enums.TipoInsumo;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "insumos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoInsumo tipo;

    @Column(name = "unidade_medida", nullable = false)
    private String unidadeMedida; // UN, M2, M, KG, ML

    @Column(name = "custo_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal custoUnitario;

    @Column(name = "estoque_atual", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal estoqueAtual = BigDecimal.ZERO;

    @Column(name = "estoque_minimo", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal estoqueMinimo = BigDecimal.ZERO;

    // Dimensões específicas para chapas (ex: MDF 2750 x 1850 x 18mm)
    @Column(name = "comprimento_mm", precision = 8, scale = 2)
    private BigDecimal comprimentoMm;

    @Column(name = "largura_mm", precision = 8, scale = 2)
    private BigDecimal larguraMm;

    @Column(name = "espessura_mm", precision = 6, scale = 2)
    private BigDecimal espessuraMm;

    private String acabamento; // Branco TX, Carvalho Hanover, etc.
}
