package com.marcenaria.modules.producao.controllers;

import com.marcenaria.domain.entities.*;
import com.marcenaria.domain.enums.*;
import com.marcenaria.domain.repositories.*;
import com.marcenaria.modules.producao.dto.CriarPedidoProducaoRequest;
import com.marcenaria.modules.producao.dto.ProdutoProducaoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/producao")
@RequiredArgsConstructor
public class ProducaoController {

    private final ItemMovelRepository itemMovelRepository;
    private final PecaCorteRepository pecaCorteRepository;
    private final ClienteRepository clienteRepository;
    private final ProjetoRepository projetoRepository;
    private final AmbienteRepository ambienteRepository;
    private final OrdemProducaoRepository ordemProducaoRepository;
    private final InsumoRepository insumoRepository;
    private final TransacaoFinanceiraRepository transacaoRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/produtos")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProdutoProducaoResponse>> listarProdutosProducao() {
        List<ItemMovel> itens = itemMovelRepository.findAll();
        List<ProdutoProducaoResponse> resposta = itens.stream()
                .map(this::converterParaResponse)
                .sorted(Comparator.comparing(ProdutoProducaoResponse::getCriadoEm, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(resposta);
    }

    @PostMapping("/pedidos")
    @Transactional
    public ResponseEntity<ProdutoProducaoResponse> criarPedido(@Valid @RequestBody CriarPedidoProducaoRequest request) {
        // 1. Cliente
        Cliente cliente = clienteRepository.findAll().stream()
                .filter(c -> c.getNomeRazaoSocial() != null && c.getNomeRazaoSocial().trim().equalsIgnoreCase(request.getNomeCliente().trim()))
                .findFirst()
                .orElseGet(() -> clienteRepository.save(Cliente.builder()
                        .nomeRazaoSocial(request.getNomeCliente().trim())
                        .telefone(request.getTelefone() != null && !request.getTelefone().isBlank() ? request.getTelefone() : "(00) 00000-0000")
                        .tipoPessoa(TipoPessoa.PF)
                        .build()));

        // 2. Projeto
        String codPrj = "PRJ-" + LocalDate.now().getYear() + "-" + (int)(Math.random() * 900 + 100);
        Usuario vendedor = usuarioRepository.findAll().stream().findFirst().orElse(null);
        Projeto projeto = Projeto.builder()
                .codigo(codPrj)
                .cliente(cliente)
                .vendedor(vendedor)
                .titulo(request.getNomeMovel() + (request.getAmbiente() != null ? " (" + request.getAmbiente() + ")" : ""))
                .status(StatusProjeto.EM_PRODUCAO)
                .valorFinalFechado(request.getValorTotal() != null ? request.getValorTotal() : BigDecimal.ZERO)
                .custoTotalMateriais(request.getCustoMateriais() != null ? request.getCustoMateriais() : BigDecimal.ZERO)
                .build();
        projetoRepository.save(projeto);

        // 3. Ambiente
        Ambiente amb = Ambiente.builder()
                .projeto(projeto)
                .nome(request.getAmbiente() != null && !request.getAmbiente().isBlank() ? request.getAmbiente() : "Principal")
                .build();
        ambienteRepository.save(amb);

        // 4. Item Móvel
        ItemMovel item = ItemMovel.builder()
                .ambiente(amb)
                .nome(request.getNomeMovel())
                .pronto(false)
                .quantidade(1)
                .build();
        itemMovelRepository.save(item);

        // 5. Peças de Corte
        List<Insumo> insumosDisponiveis = insumoRepository.findAll();
        Insumo insumoPadrao = insumosDisponiveis.isEmpty() ? null : insumosDisponiveis.get(0);

        for (CriarPedidoProducaoRequest.PecaItemRequest p : request.getPecas()) {
            Insumo chapa = null;
            if (p.getChapaInsumoId() != null) {
                chapa = insumoRepository.findByCodigo(p.getChapaInsumoId()).orElse(null);
            }
            if (chapa == null) {
                chapa = insumoPadrao;
            }

            PecaCorte peca = PecaCorte.builder()
                    .itemMovel(item)
                    .descricao(p.getDescricao())
                    .quantidade(p.getQuantidade() > 0 ? p.getQuantidade() : 1)
                    .comprimentoMm(p.getComprimentoMm() != null ? p.getComprimentoMm() : BigDecimal.valueOf(600))
                    .larguraMm(p.getLarguraMm() != null ? p.getLarguraMm() : BigDecimal.valueOf(400))
                    .espessuraMm(p.getEspessuraMm() != null ? p.getEspessuraMm() : BigDecimal.valueOf(18))
                    .orientacaoVeio(p.getOrientacaoVeio() != null ? p.getOrientacaoVeio() : OrientacaoVeio.LONGITUDINAL)
                    .fitaComprimento1(p.isFitaComprimento1())
                    .fitaComprimento2(p.isFitaComprimento2())
                    .fitaLargura1(p.isFitaLargura1())
                    .fitaLargura2(p.isFitaLargura2())
                    .chapaInsumo(chapa)
                    .cortada(false)
                    .bordeada(false)
                    .build();
            pecaCorteRepository.save(peca);
        }

        // 6. Ordem de Produção
        String codOP = "OP-" + LocalDate.now().getYear() + "-" + (int)(Math.random() * 9000 + 1000);
        OrdemProducao op = OrdemProducao.builder()
                .codigo(codOP)
                .projeto(projeto)
                .status(StatusOP.CORTE)
                .build();
        ordemProducaoRepository.save(op);

        // 7. Financeiro: 50% Sinal + 50% Entrega
        BigDecimal total = request.getValorTotal() != null ? request.getValorTotal() : BigDecimal.ZERO;
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal sinal = total.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal entrega = total.subtract(sinal);
            TransacaoFinanceira t1 = TransacaoFinanceira.builder()
                    .projeto(projeto)
                    .descricao("Entrada 50% (Sinal) - " + codOP)
                    .valor(sinal)
                    .status(StatusTransacao.PENDENTE)
                    .dataVencimento(LocalDate.now())
                    .build();
            TransacaoFinanceira t2 = TransacaoFinanceira.builder()
                    .projeto(projeto)
                    .descricao("Segunda Parcela 50% (Entrega) - " + codOP)
                    .valor(entrega)
                    .status(StatusTransacao.PENDENTE)
                    .dataVencimento(LocalDate.now().plusDays(30))
                    .build();
            transacaoRepository.saveAll(List.of(t1, t2));
        }

        // Atualiza a lista em memória do item para o response
        item = itemMovelRepository.findById(item.getId()).orElse(item);
        return ResponseEntity.ok(converterParaResponse(item));
    }

    @PatchMapping("/produtos/{id}/status")
    @Transactional
    public ResponseEntity<ProdutoProducaoResponse> alternarStatusProduto(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Boolean> payload
    ) {
        ItemMovel item = itemMovelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));

        boolean novoStatus = (payload != null && payload.containsKey("pronto"))
                ? payload.get("pronto")
                : !item.isPronto();

        item.setPronto(novoStatus);

        // Se marcou como pronto, sincroniza as peças e avança o projeto para MONTAGEM
        Ambiente amb = item.getAmbiente();
        Projeto prj = amb != null ? amb.getProjeto() : null;

        if (novoStatus) {
            if (item.getPecas() != null) {
                for (PecaCorte peca : item.getPecas()) {
                    peca.setCortada(true);
                    peca.setBordeada(true);
                    pecaCorteRepository.save(peca);
                }
            }
            if (prj != null) {
                prj.setStatus(StatusProjeto.MONTAGEM);
                projetoRepository.save(prj);
            }
        } else {
            if (prj != null && prj.getStatus() == StatusProjeto.MONTAGEM) {
                prj.setStatus(StatusProjeto.EM_PRODUCAO);
                projetoRepository.save(prj);
            }
        }

        itemMovelRepository.save(item);
        return ResponseEntity.ok(converterParaResponse(item));
    }

    @PatchMapping("/pecas/{id}/status")
    @Transactional
    public ResponseEntity<ProdutoProducaoResponse.PecaProducaoResponse> atualizarStatusPeca(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> payload
    ) {
        PecaCorte peca = pecaCorteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Peça não encontrada"));

        if (payload.containsKey("cortada")) {
            peca.setCortada(payload.get("cortada"));
        }
        if (payload.containsKey("bordeada")) {
            peca.setBordeada(payload.get("bordeada"));
        }
        pecaCorteRepository.save(peca);

        // Se todas as peças do móvel estiverem cortadas e bordeadas, atualiza o móvel como pronto e projeto para MONTAGEM
        ItemMovel item = peca.getItemMovel();
        if (item != null && item.getPecas() != null && !item.getPecas().isEmpty()) {
            boolean todasProntas = item.getPecas().stream()
                    .allMatch(p -> p.getId().equals(peca.getId())
                            ? (peca.isCortada() && peca.isBordeada())
                            : (p.isCortada() && p.isBordeada()));
            if (todasProntas && !item.isPronto()) {
                item.setPronto(true);
                itemMovelRepository.save(item);

                Ambiente amb = item.getAmbiente();
                if (amb != null && amb.getProjeto() != null) {
                    Projeto prj = amb.getProjeto();
                    prj.setStatus(StatusProjeto.MONTAGEM);
                    projetoRepository.save(prj);
                }
            }
        }

        return ResponseEntity.ok(converterPecaParaResponse(peca));
    }

    @PatchMapping("/projetos/{codigo}/status")
    @Transactional
    public ResponseEntity<Map<String, Object>> atualizarStatusProjeto(
            @PathVariable String codigo,
            @RequestBody Map<String, Object> payload
    ) {
        Object novoStatusObj = payload.get("status");
        if (novoStatusObj == null) {
            throw new IllegalArgumentException("Status não informado");
        }

        StatusProjeto novoStatus = StatusProjeto.valueOf(novoStatusObj.toString().toUpperCase());
        Optional<Projeto> prjOpt = projetoRepository.findByCodigo(codigo);
        Projeto prj;

        if (prjOpt.isPresent()) {
            prj = prjOpt.get();
            prj.setStatus(novoStatus);
        } else {
            // Auto-registro (Upsert): Se o projeto foi criado no Kanban/frontend, persiste no banco
            String nomeCliente = payload.getOrDefault("cliente", "Cliente " + codigo).toString();
            String telefone = payload.getOrDefault("telefone", "(11) 90000-0000").toString();
            String ambiente = payload.getOrDefault("ambiente", "Principal").toString();

            Cliente cliente = clienteRepository.findAll().stream()
                    .filter(c -> c.getNomeRazaoSocial() != null && c.getNomeRazaoSocial().trim().equalsIgnoreCase(nomeCliente.trim()))
                    .findFirst()
                    .orElseGet(() -> clienteRepository.save(Cliente.builder()
                            .nomeRazaoSocial(nomeCliente.trim())
                            .telefone(telefone)
                            .tipoPessoa(TipoPessoa.PF)
                            .build()));

            Usuario vendedor = usuarioRepository.findAll().stream().findFirst().orElse(null);

            prj = Projeto.builder()
                    .codigo(codigo)
                    .cliente(cliente)
                    .vendedor(vendedor)
                    .titulo("Projeto " + codigo + " (" + ambiente + ")")
                    .status(novoStatus)
                    .valorFinalFechado(BigDecimal.ZERO)
                    .custoTotalMateriais(BigDecimal.ZERO)
                    .build();
        }

        Object valTotalObj = payload.get("valorTotal");
        if (valTotalObj != null) {
            try {
                prj.setValorFinalFechado(new BigDecimal(valTotalObj.toString()));
            } catch (Exception ignored) {}
        }

        // Quando a O.S. for concluída, liquida todos os recebimentos financeiros no banco sem deixar nada pendente
        if (novoStatus == StatusProjeto.CONCLUIDO) {
            List<TransacaoFinanceira> transacoes = transacaoRepository.findByProjeto(prj);
            if (transacoes != null && !transacoes.isEmpty()) {
                for (TransacaoFinanceira t : transacoes) {
                    t.setStatus(StatusTransacao.PAGO);
                    t.setDataPagamento(LocalDate.now());
                }
                transacaoRepository.saveAll(transacoes);
            } else if (prj.getValorFinalFechado() != null && prj.getValorFinalFechado().compareTo(BigDecimal.ZERO) > 0) {
                TransacaoFinanceira tQuitada = TransacaoFinanceira.builder()
                        .projeto(prj)
                        .descricao("Recebimento Total Quitado (Conclusão O.S.)")
                        .valor(prj.getValorFinalFechado())
                        .status(StatusTransacao.PAGO)
                        .dataVencimento(LocalDate.now())
                        .dataPagamento(LocalDate.now())
                        .build();
                transacaoRepository.save(tQuitada);
            }

            // Marca todas as peças e itens como concluídos na oficina
            List<Ambiente> ambientes = ambienteRepository.findAll().stream()
                    .filter(a -> a.getProjeto() != null && a.getProjeto().getId().equals(prj.getId()))
                    .toList();
            for (Ambiente a : ambientes) {
                List<ItemMovel> itens = itemMovelRepository.findAll().stream()
                        .filter(i -> i.getAmbiente() != null && i.getAmbiente().getId().equals(a.getId()))
                        .toList();
                for (ItemMovel item : itens) {
                    item.setPronto(true);
                    if (item.getPecas() != null) {
                        for (PecaCorte peca : item.getPecas()) {
                            peca.setCortada(true);
                            peca.setBordeada(true);
                            pecaCorteRepository.save(peca);
                        }
                    }
                    itemMovelRepository.save(item);
                }
            }
        } else if (novoStatus == StatusProjeto.MONTAGEM) {
            // Se a O.S. retornar/reabrir de CONCLUIDO para MONTAGEM, estorna o saldo da entrega que não foi quitado
            List<TransacaoFinanceira> transacoes = transacaoRepository.findByProjeto(prj);
            if (transacoes != null && !transacoes.isEmpty()) {
                for (TransacaoFinanceira t : transacoes) {
                    String desc = t.getDescricao() != null ? t.getDescricao().toLowerCase() : "";
                    if (desc.contains("entrega") || desc.contains("saldo") || desc.contains("restante")) {
                        t.setStatus(StatusTransacao.PENDENTE);
                        t.setDataPagamento(null);
                    } else if (desc.contains("total quitado")) {
                        BigDecimal total = t.getValor() != null ? t.getValor() : BigDecimal.ZERO;
                        BigDecimal sinal = total.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
                        BigDecimal entrega = total.subtract(sinal);
                        t.setValor(sinal);
                        t.setDescricao("50% Sinal (Recebido)");
                        t.setStatus(StatusTransacao.PAGO);

                        TransacaoFinanceira tEntregaPendente = TransacaoFinanceira.builder()
                                .projeto(prj)
                                .descricao("50% Saldo na Entrega (Pendente)")
                                .valor(entrega)
                                .status(StatusTransacao.PENDENTE)
                                .dataVencimento(LocalDate.now().plusDays(15))
                                .dataPagamento(null)
                                .build();
                        transacaoRepository.save(tEntregaPendente);
                    }
                }
                transacaoRepository.saveAll(transacoes);
            }
        }

        projetoRepository.save(prj);

        Map<String, Object> resp = new HashMap<>();
        resp.put("sucesso", true);
        resp.put("codigo", codigo);
        resp.put("status", novoStatus.name());
        return ResponseEntity.ok(resp);
    }

    private ProdutoProducaoResponse converterParaResponse(ItemMovel item) {
        Ambiente amb = item.getAmbiente();
        Projeto prj = amb != null ? amb.getProjeto() : null;
        Cliente cli = prj != null ? prj.getCliente() : null;

        String codOP = "OP-PRODUCAO";
        if (prj != null && prj.getOrdemProducao() != null) {
            codOP = prj.getOrdemProducao().getCodigo();
        } else if (prj != null) {
            Optional<OrdemProducao> opOpt = ordemProducaoRepository.findAll().stream()
                    .filter(o -> o.getProjeto() != null && o.getProjeto().getId().equals(prj.getId()))
                    .findFirst();
            if (opOpt.isPresent()) {
                codOP = opOpt.get().getCodigo();
            }
        }

        List<ProdutoProducaoResponse.PecaProducaoResponse> pecasResp = item.getPecas().stream()
                .map(this::converterPecaParaResponse)
                .collect(Collectors.toList());

        return ProdutoProducaoResponse.builder()
                .id(item.getId())
                .nome(item.getNome())
                .clienteNome(cli != null ? cli.getNomeRazaoSocial() : "Cliente Balcão")
                .clienteTelefone(cli != null ? cli.getTelefone() : "")
                .codigoProjeto(prj != null ? prj.getCodigo() : "PRJ-000")
                .codigoOP(codOP)
                .ambiente(amb != null ? amb.getNome() : "Geral")
                .valorTotal(prj != null && prj.getValorFinalFechado() != null ? prj.getValorFinalFechado() : BigDecimal.ZERO)
                .pronto(item.isPronto())
                .criadoEm(prj != null && prj.getCriadoEm() != null ? prj.getCriadoEm() : null)
                .pecas(pecasResp)
                .build();
    }

    private ProdutoProducaoResponse.PecaProducaoResponse converterPecaParaResponse(PecaCorte p) {
        StringBuilder fitas = new StringBuilder();
        if (p.isFitaComprimento1()) fitas.append("C1 ");
        if (p.isFitaComprimento2()) fitas.append("C2 ");
        if (p.isFitaLargura1()) fitas.append("L1 ");
        if (p.isFitaLargura2()) fitas.append("L2 ");
        String fitaTexto = fitas.toString().trim();
        if (fitaTexto.isEmpty()) {
            fitaTexto = "Sem fita";
        } else if (p.isFitaComprimento1() && p.isFitaComprimento2() && p.isFitaLargura1() && p.isFitaLargura2()) {
            fitaTexto = "4 Lados (C1, C2, L1, L2)";
        }

        String matNome = p.getChapaInsumo() != null ? p.getChapaInsumo().getNome() : "MDF 18mm";

        return ProdutoProducaoResponse.PecaProducaoResponse.builder()
                .id(p.getId())
                .descricao(p.getDescricao())
                .quantidade(p.getQuantidade())
                .comprimentoMm(p.getComprimentoMm())
                .larguraMm(p.getLarguraMm())
                .espessuraMm(p.getEspessuraMm())
                .orientacaoVeio(p.getOrientacaoVeio() != null ? p.getOrientacaoVeio().name() : "LONGITUDINAL")
                .fitaResumo(fitaTexto)
                .materialNome(matNome)
                .cortada(p.isCortada())
                .bordeada(p.isBordeada())
                .build();
    }
}
