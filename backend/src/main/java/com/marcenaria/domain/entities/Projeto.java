package com.marcenaria.domain.entities;

import com.marcenaria.domain.enums.StatusProjeto;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projetos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String codigo; // Ex: PRJ-2026-001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_id", nullable = true)
    private Usuario vendedor;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusProjeto status = StatusProjeto.VISITA_TECNICA;

    // Parâmetros de Orçamento
    @Column(name = "percentual_desperdicio", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentualDesperdicio = new BigDecimal("15.00");

    @Column(name = "taxa_hora_homem", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxaHoraHomem = new BigDecimal("65.00");

    @Column(name = "custo_fixo_rateio", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal custoFixoRateio = BigDecimal.ZERO;

    @Column(name = "margem_lucro_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal margemLucroPercent = new BigDecimal("35.00");

    // Totais Consolidados
    @Column(name = "custo_total_materiais", precision = 12, scale = 2)
    private BigDecimal custoTotalMateriais;

    @Column(name = "total_horas_producao", precision = 6, scale = 2)
    private BigDecimal totalHorasProducao;

    @Column(name = "custo_total_mao_de_obra", precision = 12, scale = 2)
    private BigDecimal custoTotalMaoDeObra;

    @Column(name = "valor_venda_sugerido", precision = 12, scale = 2)
    private BigDecimal valorVendaSugerido;

    @Column(name = "valor_final_fechado", precision = 12, scale = 2)
    private BigDecimal valorFinalFechado;

    private LocalDate dataVisita;
    private LocalDate dataPrevisaoEntrega;
    private LocalDate dataConclusao;

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Ambiente> ambientes = new ArrayList<>();

    @OneToOne(mappedBy = "projeto", cascade = CascadeType.ALL)
    private OrdemProducao ordemProducao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();
}
