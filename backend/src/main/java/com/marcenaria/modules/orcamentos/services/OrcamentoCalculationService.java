package com.marcenaria.modules.orcamentos.services;

import com.marcenaria.domain.entities.Insumo;
import com.marcenaria.domain.repositories.InsumoRepository;
import com.marcenaria.modules.orcamentos.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrcamentoCalculationService {

    private final InsumoRepository insumoRepository;

    /**
     * Realiza o cálculo dinâmico da Engenharia do Produto (BOM) e Precificação Comercial
     */
    public OrcamentoResponse calcular(CalcularOrcamentoRequest request) {
        ParametrosCalculoRequest param = request.getParametros();

        BigDecimal fatorPerca = BigDecimal.ONE.add(
                param.getPercentualPerca().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
        );
        BigDecimal fatorPerdaFita = new BigDecimal("1.10"); // 10% de perda em topos e refilador

        Map<String, InsumoAcumuladorChapa> mapaChapas = new HashMap<>();
        Map<String, InsumoAcumuladorFita> mapaFitas = new HashMap<>();
        Map<String, InsumoAcumuladorFerragem> mapaFerragens = new HashMap<>();

        for (AmbienteRequest amb : request.getAmbientes()) {
            for (ItemMovelRequest item : amb.getItens()) {
                BigDecimal qtdItem = BigDecimal.valueOf(item.getQuantidade());

                // Processa Peças de Corte
                for (PecaCorteRequest peca : item.getPecas()) {
                    BigDecimal qtdTotalPeca = BigDecimal.valueOf(peca.getQuantidade()).multiply(qtdItem);

                    // 1. Chapas
                    Insumo insumoChapa = buscarOuCriarMockChapa(peca.getChapaInsumoId());
                    BigDecimal areaUnitM2 = peca.getComprimentoMm()
                            .multiply(peca.getLarguraMm())
                            .divide(new BigDecimal("1000000"), 6, RoundingMode.HALF_UP);
                    BigDecimal areaTotalM2 = areaUnitM2.multiply(qtdTotalPeca);

                    mapaChapas.computeIfAbsent(insumoChapa.getCodigo(), k -> new InsumoAcumuladorChapa(insumoChapa))
                            .adicionarArea(areaTotalM2);

                    // 2. Fitas de Borda
                    if (peca.getFitaInsumoId() != null && !peca.getFitaInsumoId().isBlank()) {
                        Insumo insumoFita = buscarOuCriarMockFita(peca.getFitaInsumoId());
                        BigDecimal perimetroMm = BigDecimal.ZERO;
                        if (peca.isFitaComprimento1()) perimetroMm = perimetroMm.add(peca.getComprimentoMm());
                        if (peca.isFitaComprimento2()) perimetroMm = perimetroMm.add(peca.getComprimentoMm());
                        if (peca.isFitaLargura1()) perimetroMm = perimetroMm.add(peca.getLarguraMm());
                        if (peca.isFitaLargura2()) perimetroMm = perimetroMm.add(peca.getLarguraMm());

                        BigDecimal metrosLineares = perimetroMm
                                .divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP)
                                .multiply(qtdTotalPeca);

                        if (metrosLineares.compareTo(BigDecimal.ZERO) > 0) {
                            mapaFitas.computeIfAbsent(insumoFita.getCodigo(), k -> new InsumoAcumuladorFita(insumoFita))
                                    .adicionarMetros(metrosLineares);
                        }
                    }
                }

                // 3. Ferragens e Insumos Adicionais
                for (ItemMovelRequest.InsumoAdicionalRequest extra : item.getInsumosAdicionais()) {
                    Insumo insumoFerragem = buscarOuCriarMockFerragem(extra.getInsumoId());
                    BigDecimal qtdTotal = extra.getQuantidade().multiply(qtdItem);

                    mapaFerragens.computeIfAbsent(insumoFerragem.getCodigo(), k -> new InsumoAcumuladorFerragem(insumoFerragem))
                            .adicionarQuantidade(qtdTotal);
                }
            }
        }

        // Consolidação Chapas: COBRANÇA POR CHAPA INTEIRA
        BigDecimal custoTotalChapas = BigDecimal.ZERO;
        int totalChapasGeral = 0;
        List<OrcamentoResponse.ConsumoChapa> listaChapas = new ArrayList<>();
        for (InsumoAcumuladorChapa acum : mapaChapas.values()) {
            BigDecimal areaComPerca = acum.areaLiquidaM2.multiply(fatorPerca).setScale(4, RoundingMode.HALF_UP);
            BigDecimal areaPadraoM2 = acum.insumo.getComprimentoMm().multiply(acum.insumo.getLarguraMm())
                    .divide(new BigDecimal("1000000"), 4, RoundingMode.HALF_UP);

            int chapasInteiras = (int) Math.ceil(areaComPerca.divide(areaPadraoM2, 4, RoundingMode.HALF_UP).doubleValue());
            if (chapasInteiras < 1) chapasInteiras = 1; // Pelo menos 1 chapa inteira

            // Custo por chapa inteira adquirida
            BigDecimal custoTotal = acum.insumo.getCustoUnitario().multiply(BigDecimal.valueOf(chapasInteiras)).setScale(2, RoundingMode.HALF_UP);
            custoTotalChapas = custoTotalChapas.add(custoTotal);
            totalChapasGeral += chapasInteiras;

            listaChapas.add(OrcamentoResponse.ConsumoChapa.builder()
                    .insumoId(acum.insumo.getCodigo())
                    .nome(acum.insumo.getNome())
                    .areaLiquidaM2(acum.areaLiquidaM2.setScale(3, RoundingMode.HALF_UP))
                    .areaComDesperdicioM2(areaComPerca.setScale(3, RoundingMode.HALF_UP))
                    .areaChapaPadraoM2(areaPadraoM2)
                    .estimativaChapasInteiras(chapasInteiras)
                    .custoUnitario(acum.insumo.getCustoUnitario())
                    .custoTotal(custoTotal)
                    .build());
        }

        // Consolidação Fitas de Borda
        BigDecimal custoTotalFitas = BigDecimal.ZERO;
        List<OrcamentoResponse.ConsumoFita> listaFitas = new ArrayList<>();
        for (InsumoAcumuladorFita acum : mapaFitas.values()) {
            BigDecimal metrosComPerda = acum.metrosLineares.multiply(fatorPerdaFita).setScale(2, RoundingMode.HALF_UP);
            BigDecimal custoTotal = metrosComPerda.multiply(acum.insumo.getCustoUnitario()).setScale(2, RoundingMode.HALF_UP);
            custoTotalFitas = custoTotalFitas.add(custoTotal);

            listaFitas.add(OrcamentoResponse.ConsumoFita.builder()
                    .insumoId(acum.insumo.getCodigo())
                    .nome(acum.insumo.getNome())
                    .metrosLinearesLiquidos(acum.metrosLineares.setScale(2, RoundingMode.HALF_UP))
                    .metrosLinearesComPerda(metrosComPerda)
                    .custoUnitarioMetro(acum.insumo.getCustoUnitario())
                    .custoTotal(custoTotal)
                    .build());
        }

        // Consolidação Ferragens
        BigDecimal custoTotalFerragens = BigDecimal.ZERO;
        List<OrcamentoResponse.ConsumoFerragem> listaFerragens = new ArrayList<>();
        for (InsumoAcumuladorFerragem acum : mapaFerragens.values()) {
            BigDecimal custoTotal = acum.quantidade.multiply(acum.insumo.getCustoUnitario()).setScale(2, RoundingMode.HALF_UP);
            custoTotalFerragens = custoTotalFerragens.add(custoTotal);

            listaFerragens.add(OrcamentoResponse.ConsumoFerragem.builder()
                    .insumoId(acum.insumo.getCodigo())
                    .nome(acum.insumo.getNome())
                    .quantidadeTotal(acum.quantidade.setScale(2, RoundingMode.HALF_UP))
                    .unidadeMedida(acum.insumo.getUnidadeMedida())
                    .custoUnitario(acum.insumo.getCustoUnitario())
                    .custoTotal(custoTotal)
                    .build());
        }

        // Custo Total de Materiais (Chapas Inteiras + Fitas + Ferragens)
        BigDecimal custoTotalMateriais = custoTotalChapas.add(custoTotalFitas).add(custoTotalFerragens);

        // Precificação com Multiplicador Direto sobre os Materiais (Regra Padrão do Marceneiro)
        BigDecimal multiplicador = param.getMultiplicadorMateriais();
        BigDecimal valorVendaSugerido = custoTotalMateriais.multiply(multiplicador).setScale(2, RoundingMode.HALF_UP);

        // Condição de Pagamento: 50% no Fechamento / Inicial + 50% na Entrega
        BigDecimal valorEntradaSinal50 = valorVendaSugerido.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal valorEntregaFinal50 = valorVendaSugerido.subtract(valorEntradaSinal50);

        // Lucro Bruto Estimado
        BigDecimal lucroBrutoEstimado = valorVendaSugerido.subtract(custoTotalMateriais);

        OrcamentoResponse.TotaisOrcamento totais = OrcamentoResponse.TotaisOrcamento.builder()
                .totalChapasInteiras(totalChapasGeral)
                .custoTotalChapas(custoTotalChapas)
                .custoTotalFitas(custoTotalFitas)
                .custoTotalFerragens(custoTotalFerragens)
                .custoTotalMateriais(custoTotalMateriais)
                .multiplicadorMateriais(multiplicador)
                .valorVendaSugerido(valorVendaSugerido)
                .valorEntradaSinal50(valorEntradaSinal50)
                .valorEntregaFinal50(valorEntregaFinal50)
                .lucroBrutoEstimado(lucroBrutoEstimado)
                .build();

        return OrcamentoResponse.builder()
                .resumoConsumo(OrcamentoResponse.ResumoConsumo.builder()
                        .chapas(listaChapas)
                        .fitasBorda(listaFitas)
                        .ferragensEInsumos(listaFerragens)
                        .build())
                .totais(totais)
                .build();
    }

    private Insumo buscarOuCriarMockChapa(String codigo) {
        return insumoRepository.findByCodigo(codigo).orElseGet(() -> Insumo.builder()
                .codigo(codigo)
                .nome("MDF Branco TX 18mm 2 Faces")
                .unidadeMedida("UN")
                .custoUnitario(new BigDecimal("245.00"))
                .comprimentoMm(new BigDecimal("2750.00"))
                .larguraMm(new BigDecimal("1850.00"))
                .espessuraMm(new BigDecimal("18.00"))
                .build());
    }

    private Insumo buscarOuCriarMockFita(String codigo) {
        return insumoRepository.findByCodigo(codigo).orElseGet(() -> Insumo.builder()
                .codigo(codigo)
                .nome("Fita de Borda PVC Branca 22mm")
                .unidadeMedida("M")
                .custoUnitario(new BigDecimal("0.95"))
                .build());
    }

    private Insumo buscarOuCriarMockFerragem(String codigo) {
        return insumoRepository.findByCodigo(codigo).orElseGet(() -> Insumo.builder()
                .codigo(codigo)
                .nome("Corrediça Telescópica 450mm")
                .unidadeMedida("UN")
                .custoUnitario(new BigDecimal("32.50"))
                .build());
    }

    // Classes auxiliares de acumulação
    private static class InsumoAcumuladorChapa {
        Insumo insumo;
        BigDecimal areaLiquidaM2 = BigDecimal.ZERO;
        InsumoAcumuladorChapa(Insumo i) { this.insumo = i; }
        void adicionarArea(BigDecimal a) { this.areaLiquidaM2 = this.areaLiquidaM2.add(a); }
    }

    private static class InsumoAcumuladorFita {
        Insumo insumo;
        BigDecimal metrosLineares = BigDecimal.ZERO;
        InsumoAcumuladorFita(Insumo i) { this.insumo = i; }
        void adicionarMetros(BigDecimal m) { this.metrosLineares = this.metrosLineares.add(m); }
    }

    private static class InsumoAcumuladorFerragem {
        Insumo insumo;
        BigDecimal quantidade = BigDecimal.ZERO;
        InsumoAcumuladorFerragem(Insumo i) { this.insumo = i; }
        void adicionarQuantidade(BigDecimal q) { this.quantidade = this.quantidade.add(q); }
    }
}
