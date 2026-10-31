package com.marcenaria.modules.producao.services;

import com.marcenaria.domain.entities.OrdemProducao;
import com.marcenaria.domain.entities.Projeto;
import com.marcenaria.domain.entities.TransacaoFinanceira;
import com.marcenaria.domain.enums.StatusOP;
import com.marcenaria.domain.enums.StatusProjeto;
import com.marcenaria.domain.enums.StatusTransacao;
import com.marcenaria.domain.repositories.OrdemProducaoRepository;
import com.marcenaria.domain.repositories.ProjetoRepository;
import com.marcenaria.domain.repositories.TransacaoFinanceiraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrdemProducaoService {

    private final ProjetoRepository projetoRepository;
    private final OrdemProducaoRepository ordemProducaoRepository;
    private final TransacaoFinanceiraRepository transacaoRepository;

    @Transactional
    public Map<String, Object> aprovarProjetoEGerarOP(UUID projetoId, BigDecimal valorFechado) {
        if (valorFechado == null || valorFechado.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor final fechado deve ser maior que R$ 0,00");
        }

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElse(Projeto.builder()
                        .id(projetoId)
                        .codigo("PRJ-2026-" + (int)(Math.random() * 900 + 100))
                        .titulo("Projeto Sob Medida")
                        .build());

        projeto.setStatus(StatusProjeto.EM_PRODUCAO);
        projeto.setValorFinalFechado(valorFechado);
        projetoRepository.save(projeto);

        String codigoOP = "OP-" + LocalDate.now().getYear() + "-" + (int)(Math.random() * 9000 + 1000);

        OrdemProducao op = OrdemProducao.builder()
                .codigo(codigoOP)
                .projeto(projeto)
                .status(StatusOP.CORTE)
                .build();
        ordemProducaoRepository.save(op);

        // Provisionamento de Entrada Fracionada no Financeiro (50% Sinal + 50% Montagem)
        BigDecimal valorSinal = valorFechado.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal valorFinal = valorFechado.subtract(valorSinal);

        TransacaoFinanceira parcela1 = TransacaoFinanceira.builder()
                .projeto(projeto)
                .descricao("Entrada 50% (Sinal Contratual) - " + codigoOP)
                .valor(valorSinal)
                .status(StatusTransacao.PENDENTE)
                .dataVencimento(LocalDate.now())
                .build();

        TransacaoFinanceira parcela2 = TransacaoFinanceira.builder()
                .projeto(projeto)
                .descricao("Segunda Parcela 50% (Entrega / Montagem) - " + codigoOP)
                .valor(valorFinal)
                .status(StatusTransacao.PENDENTE)
                .dataVencimento(LocalDate.now().plusDays(30))
                .build();

        transacaoRepository.saveAll(List.of(parcela1, parcela2));

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("sucesso", true);
        resposta.put("mensagem", "Projeto aprovado com sucesso! OP gerada e contas a receber provisionadas.");
        resposta.put("codigoOP", codigoOP);
        resposta.put("statusProjeto", StatusProjeto.EM_PRODUCAO.name());
        resposta.put("valorTotal", valorFechado);
        resposta.put("sinalContratual", valorSinal);
        resposta.put("parcelaFinal", valorFinal);

        return resposta;
    }
}
