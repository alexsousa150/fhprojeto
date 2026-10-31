package com.marcenaria.config;

import com.marcenaria.domain.entities.*;
import com.marcenaria.domain.enums.*;
import com.marcenaria.domain.repositories.*;
import com.marcenaria.security.MfaTotpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final InsumoRepository insumoRepository;
    private final ClienteRepository clienteRepository;
    private final ProjetoRepository projetoRepository;
    private final AmbienteRepository ambienteRepository;
    private final ItemMovelRepository itemMovelRepository;
    private final PecaCorteRepository pecaCorteRepository;
    private final OrdemProducaoRepository ordemProducaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final MfaTotpService mfaTotpService;

    @Override
    public void run(String... args) {
        inicializarUsuarios();
        inicializarInsumos();
        // inicializarPedidosExemplo(); // Desativado para manter banco limpo sem pedidos/clientes fake
    }

    private void inicializarUsuarios() {
        if (usuarioRepository.count() == 0) {
            log.info("Inicializando usuários de teste para marcenaria...");

            // 1. Usuário Administrador (sem 2FA obrigatório inicial)
            Usuario admin = Usuario.builder()
                    .nome("Carlos Administrador")
                    .email("admin@marcenaria.com")
                    .senhaHash(passwordEncoder.encode("Marcenaria@2026!"))
                    .cargo(Role.ADMIN)
                    .mfaHabilitado(false)
                    .build();

            // 2. Marceneiro Mestre (com 2FA ativado)
            String segredoMfa = mfaTotpService.gerarNovoSegredo();
            Usuario marceneiro = Usuario.builder()
                    .nome("Mestre Marceneiro")
                    .email("marceneiro.mestre@marcenariapro.com")
                    .senhaHash(passwordEncoder.encode("Marcenaria@2026!"))
                    .cargo(Role.MARCENEIRO_PRODUCAO)
                    .mfaHabilitado(true)
                    .mfaSecret(segredoMfa)
                    .build();

            usuarioRepository.saveAll(List.of(admin, marceneiro));
            log.info("Usuários criados com sucesso! Login: admin@marcenaria.com / Senha: Marcenaria@2026!");
        }
    }

    private void cadastrarSeNaoExistir(String codigo, String nome, TipoInsumo tipo, String unidadeMedida, String custoUnitario, Double espessuraMm) {
        if (insumoRepository.findByCodigo(codigo).isEmpty()) {
            Insumo insumo = Insumo.builder()
                    .codigo(codigo)
                    .nome(nome)
                    .tipo(tipo)
                    .unidadeMedida(unidadeMedida)
                    .custoUnitario(new BigDecimal(custoUnitario))
                    .espessuraMm(espessuraMm != null ? BigDecimal.valueOf(espessuraMm) : null)
                    .estoqueAtual(new BigDecimal("10.000"))
                    .estoqueMinimo(new BigDecimal("2.000"))
                    .build();
            insumoRepository.save(insumo);
        }
    }

    private void inicializarInsumos() {
        log.info("Sincronizando catálogo de insumos da marcenaria com base na planilha padrão...");

        // 8 Chapas de MDF
        cadastrarSeNaoExistir("mdf-branco-15", "MDF BRANCO DE 15MM", TipoInsumo.CHAPA, "UN", "289.00", 15.0);
        cadastrarSeNaoExistir("mdf-branco-6", "MDF BRANCO 6MM", TipoInsumo.CHAPA, "UN", "221.00", 6.0);
        cadastrarSeNaoExistir("mdf-naval-15", "MDF NAVAL 15MM", TipoInsumo.CHAPA, "UN", "420.00", 15.0);
        cadastrarSeNaoExistir("mdf-naval-6", "MDF NAVAL 6MM", TipoInsumo.CHAPA, "UN", "360.00", 6.0);
        cadastrarSeNaoExistir("mdf-brilhante-15", "MDF BRILHANTE 15MM", TipoInsumo.CHAPA, "UN", "550.00", 15.0);
        cadastrarSeNaoExistir("mdf-brilhante-6", "MDF BRILHANTE 6MM", TipoInsumo.CHAPA, "UN", "490.00", 6.0);
        cadastrarSeNaoExistir("mdf-amadeirado-15", "MDF AMADEIRADO 15 MM", TipoInsumo.CHAPA, "UN", "490.00", 15.0);
        cadastrarSeNaoExistir("mdf-amadeirado-6", "MDF AMADEIRADO 6MM", TipoInsumo.CHAPA, "UN", "460.00", 6.0);

        // 32 Fitas, Ferragens, Perfis, Químicos e Insumos
        cadastrarSeNaoExistir("fita-amadeirada-64", "FITA AMADEIRADA 64MM", TipoInsumo.FITA_BORDA, "rolo", "95.00", null);
        cadastrarSeNaoExistir("fita-branca-22", "FITA BRANCA 22MM", TipoInsumo.FITA_BORDA, "rolo", "20.00", null);
        cadastrarSeNaoExistir("fita-branca-35", "FITA BRANCA 35MM", TipoInsumo.FITA_BORDA, "rolo", "30.00", null);
        cadastrarSeNaoExistir("fita-branca-64", "FITA BRANCA 64MM", TipoInsumo.FITA_BORDA, "rolo", "40.00", null);

        cadastrarSeNaoExistir("corredica-50cm", "CORREDIÇA 50CM", TipoInsumo.FERRAGEM, "par", "30.00", null);
        cadastrarSeNaoExistir("corredica-45cm", "CORREDIÇA 45CM", TipoInsumo.FERRAGEM, "par", "25.00", null);
        cadastrarSeNaoExistir("corredica-40cm", "CORREDIÇA 40CM", TipoInsumo.FERRAGEM, "par", "17.00", null);
        cadastrarSeNaoExistir("corredica-35cm", "CORREDIÇA 35 CM", TipoInsumo.FERRAGEM, "par", "12.00", null);

        cadastrarSeNaoExistir("dobradica-inox", "DOBRADIÇA INOX", TipoInsumo.FERRAGEM, "un", "10.00", null);
        cadastrarSeNaoExistir("dobradica-comum", "DOBRADIÇA COMUM", TipoInsumo.FERRAGEM, "un", "7.00", null);
        cadastrarSeNaoExistir("pistao", "PISTÂO", TipoInsumo.FERRAGEM, "un", "10.00", null);
        cadastrarSeNaoExistir("ro-47", "RO-47", TipoInsumo.FERRAGEM, "kit", "35.00", null);
        cadastrarSeNaoExistir("ro-21", "RO-21", TipoInsumo.FERRAGEM, "kit", "25.00", null);
        cadastrarSeNaoExistir("roldana-porta-correr", "ROLDANA PORTA CORRER", TipoInsumo.FERRAGEM, "kit", "60.00", null);

        cadastrarSeNaoExistir("calha-4x4", "CALHA 4X4", TipoInsumo.OUTRO, "barra", "100.00", null);
        cadastrarSeNaoExistir("perfil-superior", "PERFIL SUPERIOR", TipoInsumo.OUTRO, "barra", "50.00", null);
        cadastrarSeNaoExistir("perfil-inferior", "PERFIL INFERIOR", TipoInsumo.OUTRO, "barra", "40.00", null);
        cadastrarSeNaoExistir("perfil-1036", "PERFIL 1036", TipoInsumo.OUTRO, "barra", "60.00", null);

        cadastrarSeNaoExistir("cola-formica", "COLA FÓRMICA", TipoInsumo.QUIMICO_FIXACAO, "lata", "100.00", null);
        cadastrarSeNaoExistir("cola-instantanea-100ml", "COLA INSTANTANEA 100ML", TipoInsumo.QUIMICO_FIXACAO, "tubo", "40.00", null);

        cadastrarSeNaoExistir("parafuso-4x40", "PARAFUSO 4X40", TipoInsumo.QUIMICO_FIXACAO, "cento", "50.00", null);
        cadastrarSeNaoExistir("parafuso-4x25", "PARAFUSO 4X25", TipoInsumo.QUIMICO_FIXACAO, "cento", "45.00", null);
        cadastrarSeNaoExistir("parafuso-4x16", "PARAFUSO 4X16", TipoInsumo.QUIMICO_FIXACAO, "cento", "30.00", null);
        cadastrarSeNaoExistir("parafuso-6x60", "PARAFUSO 6X60", TipoInsumo.QUIMICO_FIXACAO, "cento", "65.00", null);

        cadastrarSeNaoExistir("suporte-invisivel", "SUPORTE INVISÍVEL", TipoInsumo.FERRAGEM, "un", "15.00", null);
        cadastrarSeNaoExistir("bucha", "BUCHA", TipoInsumo.QUIMICO_FIXACAO, "cento", "20.00", null);
        cadastrarSeNaoExistir("solvente", "SOLVENTE", TipoInsumo.QUIMICO_FIXACAO, "litro", "25.00", null);
        cadastrarSeNaoExistir("estopa", "ESTOPA", TipoInsumo.OUTRO, "pacote", "20.00", null);

        cadastrarSeNaoExistir("perfil-facetado", "PERFIL FACETADO", TipoInsumo.OUTRO, "barra", "40.00", null);
        cadastrarSeNaoExistir("acabamento-facetado", "ACABAMENTO FACETADO", TipoInsumo.OUTRO, "un", "7.00", null);
        cadastrarSeNaoExistir("fixa-tudo", "FIXA TUDO", TipoInsumo.QUIMICO_FIXACAO, "tubo", "40.00", null);
        cadastrarSeNaoExistir("silicone", "SILICONE", TipoInsumo.QUIMICO_FIXACAO, "tubo", "30.00", null);

        log.info("Catálogo de insumos da marcenaria inicializado e sincronizado com sucesso!");
    }

    private void inicializarPedidosExemplo() {
        if (itemMovelRepository.count() == 0) {
            log.info("Inicializando pedido exemplo para teste da folha de bancada...");

            Cliente cliente = clienteRepository.save(Cliente.builder()
                    .nomeRazaoSocial("Juliana Paes")
                    .telefone("(11) 98765-4321")
                    .tipoPessoa(TipoPessoa.PF)
                    .build());

            Usuario admin = usuarioRepository.findAll().stream().findFirst().orElse(null);

            Projeto projeto = projetoRepository.save(Projeto.builder()
                    .codigo("PRJ-2026-081")
                    .cliente(cliente)
                    .vendedor(admin)
                    .titulo("Cozinha Provençal & Ilha")
                    .status(StatusProjeto.EM_PRODUCAO)
                    .valorFinalFechado(new BigDecimal("24800.00"))
                    .custoTotalMateriais(new BigDecimal("7900.00"))
                    .build());

            Ambiente amb = ambienteRepository.save(Ambiente.builder()
                    .projeto(projeto)
                    .nome("Cozinha")
                    .build());

            ItemMovel item = itemMovelRepository.save(ItemMovel.builder()
                    .ambiente(amb)
                    .nome("Balcão Pia 1200mm (2 Portas + Gavetas)")
                    .pronto(false)
                    .quantidade(1)
                    .build());

            Insumo mdfBranco = insumoRepository.findByCodigo("mdf-branco-18").orElse(null);
            Insumo mdfCarvalho = insumoRepository.findByCodigo("mdf-carvalho-18").orElse(null);

            PecaCorte p1 = PecaCorte.builder()
                    .itemMovel(item)
                    .descricao("Lateral Direita")
                    .quantidade(1)
                    .comprimentoMm(new BigDecimal("850.00"))
                    .larguraMm(new BigDecimal("580.00"))
                    .espessuraMm(new BigDecimal("18.00"))
                    .orientacaoVeio(OrientacaoVeio.LONGITUDINAL)
                    .fitaComprimento1(true)
                    .fitaComprimento2(false)
                    .fitaLargura1(true)
                    .fitaLargura2(false)
                    .chapaInsumo(mdfBranco)
                    .cortada(true)
                    .bordeada(true)
                    .build();

            PecaCorte p2 = PecaCorte.builder()
                    .itemMovel(item)
                    .descricao("Lateral Esquerda")
                    .quantidade(1)
                    .comprimentoMm(new BigDecimal("850.00"))
                    .larguraMm(new BigDecimal("580.00"))
                    .espessuraMm(new BigDecimal("18.00"))
                    .orientacaoVeio(OrientacaoVeio.LONGITUDINAL)
                    .fitaComprimento1(true)
                    .fitaComprimento2(false)
                    .fitaLargura1(true)
                    .fitaLargura2(false)
                    .chapaInsumo(mdfBranco)
                    .cortada(true)
                    .bordeada(false)
                    .build();

            PecaCorte p3 = PecaCorte.builder()
                    .itemMovel(item)
                    .descricao("Base Inferior")
                    .quantidade(1)
                    .comprimentoMm(new BigDecimal("1164.00"))
                    .larguraMm(new BigDecimal("580.00"))
                    .espessuraMm(new BigDecimal("18.00"))
                    .orientacaoVeio(OrientacaoVeio.TRANSVERSAL)
                    .fitaComprimento1(true)
                    .chapaInsumo(mdfBranco)
                    .cortada(false)
                    .bordeada(false)
                    .build();

            PecaCorte p4 = PecaCorte.builder()
                    .itemMovel(item)
                    .descricao("Frente de Gaveta")
                    .quantidade(4)
                    .comprimentoMm(new BigDecimal("450.00"))
                    .larguraMm(new BigDecimal("160.00"))
                    .espessuraMm(new BigDecimal("18.00"))
                    .orientacaoVeio(OrientacaoVeio.LONGITUDINAL)
                    .fitaComprimento1(true)
                    .fitaComprimento2(true)
                    .fitaLargura1(true)
                    .fitaLargura2(true)
                    .chapaInsumo(mdfCarvalho != null ? mdfCarvalho : mdfBranco)
                    .cortada(false)
                    .bordeada(false)
                    .build();

            pecaCorteRepository.saveAll(List.of(p1, p2, p3, p4));

            ordemProducaoRepository.save(OrdemProducao.builder()
                    .codigo("OP-2026-1042")
                    .projeto(projeto)
                    .status(StatusOP.CORTE)
                    .build());

            log.info("Pedido piloto e Ordem de Produção OP-2026-1042 criados com sucesso!");
        }
    }
}
