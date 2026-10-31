package com.marcenaria.modules.auth.services;

import com.marcenaria.domain.entities.LoginAudit;
import com.marcenaria.domain.entities.RefreshToken;
import com.marcenaria.domain.entities.Usuario;
import com.marcenaria.domain.repositories.LoginAuditRepository;
import com.marcenaria.domain.repositories.RefreshTokenRepository;
import com.marcenaria.domain.repositories.UsuarioRepository;
import com.marcenaria.modules.auth.dto.*;
import com.marcenaria.security.JwtService;
import com.marcenaria.security.LoginAttemptService;
import com.marcenaria.security.MfaTotpService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAuditRepository auditRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MfaTotpService mfaTotpService;
    private final LoginAttemptService loginAttemptService;

    @Value("${security.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Transactional
    public LoginResponse autenticar(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String clientIp = extrairClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    registrarAuditoria(request.getEmail(), clientIp, userAgent, "USUARIO_NAO_ENCONTRADO");
                    return new BadCredentialsException("Credenciais inválidas");
                });

        // 1. Verificação de Bloqueio por Força Bruta
        if (loginAttemptService.isBloqueado(usuario)) {
            registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "CONTA_BLOQUEADA");
            throw new LockedException("Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.");
        }

        // 2. Validação da Senha com BCrypt
        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenhaHash())) {
            loginAttemptService.registrarFalha(usuario);
            registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "SENHA_INVALIDA");
            throw new BadCredentialsException("Credenciais inválidas");
        }

        // 3. Verificação de 2FA / MFA
        if (usuario.isMfaHabilitado()) {
            registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "MFA_REQUERIDO");
            String mfaTicket = jwtService.gerarMfaChallengeTicket(usuario);

            return LoginResponse.builder()
                    .status("MFA_REQUIRED")
                    .mfaTicket(mfaTicket)
                    .mensagem("Autenticação em dois fatores necessária. Informe o código de 6 dígitos.")
                    .build();
        }

        // 4. Sucesso Direto (sem 2FA ativo)
        loginAttemptService.registrarSucesso(usuario);
        registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "SUCESSO");

        return construirLoginSucessoResponse(usuario, httpResponse);
    }

    @Transactional
    public LoginResponse verificarMfa(MfaVerifyRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String clientIp = extrairClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        if (!jwtService.isMfaChallengeValido(request.getMfaTicket())) {
            throw new BadCredentialsException("Ticket de autenticação MFA inválido ou expirado.");
        }

        String email = jwtService.extrairUsername(request.getMfaTicket());
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado."));

        boolean valido = mfaTotpService.validarCodigo(usuario.getMfaSecret(), request.getCodigoTotp());

        if (!valido) {
            registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "MFA_CODIGO_INVALIDO");
            throw new BadCredentialsException("Código de verificação 2FA incorreto.");
        }

        loginAttemptService.registrarSucesso(usuario);
        registrarAuditoria(usuario.getEmail(), clientIp, userAgent, "SUCESSO_MFA");

        return construirLoginSucessoResponse(usuario, httpResponse);
    }

    @Transactional
    public MfaSetupResponse configurarMfa(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String novoSegredo = mfaTotpService.gerarNovoSegredo();
        usuario.setMfaSecret(novoSegredo);
        usuarioRepository.save(usuario);

        String qrCodeUrl = mfaTotpService.gerarQrCodeUrl(usuario.getEmail(), novoSegredo);

        return MfaSetupResponse.builder()
                .secretKey(novoSegredo)
                .manualKey(novoSegredo)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    @Transactional
    public void ativarMfa(String email, int codigoConfirmacao) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        boolean valido = mfaTotpService.validarCodigo(usuario.getMfaSecret(), codigoConfirmacao);
        if (!valido) {
            throw new BadCredentialsException("Código de confirmação incorreto.");
        }

        usuario.setMfaHabilitado(true);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public LoginResponse renovarSessao(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = extrairRefreshTokenDoCookie(request);
        if (refreshTokenString == null) {
            throw new BadCredentialsException("Refresh token não encontrado");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada ou revogada."));

        if (refreshToken.isRevogado() || refreshToken.getExpiracao().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadCredentialsException("Sessão expirada. Faça login novamente.");
        }

        Usuario usuario = refreshToken.getUsuario();
        String novoAccessToken = jwtService.gerarAccessToken(usuario);

        return LoginResponse.builder()
                .status("SUCCESS")
                .accessToken(novoAccessToken)
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .cargo(usuario.getCargo().name())
                .mensagem("Sessão renovada com sucesso")
                .build();
    }

    @Transactional
    public void deslogar(HttpServletRequest request, HttpServletResponse response) {
        String token = extrairRefreshTokenDoCookie(request);
        if (token != null) {
            refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
        }

        // Limpa o cookie HttpOnly
        ResponseCookie cookieLimpo = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Deixe true em produção HTTPS
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookieLimpo.toString());
    }

    private LoginResponse construirLoginSucessoResponse(Usuario usuario, HttpServletResponse httpResponse) {
        String accessToken = jwtService.gerarAccessToken(usuario);

        // Atualiza ou cria Refresh Token rotativo para o usuário
        RefreshToken refreshToken = refreshTokenRepository.findByUsuario(usuario)
                .orElseGet(() -> RefreshToken.builder().usuario(usuario).build());

        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiracao(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshToken.setRevogado(false);
        refreshTokenRepository.save(refreshToken);

        // Configura Cookie HttpOnly para o Refresh Token (Imune a ataques XSS)
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true)
                .secure(false) // Defina como true em produção (HTTPS)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofMillis(refreshTokenExpirationMs))
                .build();

        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return LoginResponse.builder()
                .status("SUCCESS")
                .accessToken(accessToken)
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .cargo(usuario.getCargo().name())
                .mensagem("Login efetuado com sucesso!")
                .build();
    }

    private String extrairRefreshTokenDoCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String extrairClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private void registrarAuditoria(String email, String ip, String userAgent, String status) {
        auditRepository.save(LoginAudit.builder()
                .email(email)
                .ipOrigem(ip)
                .userAgent(userAgent)
                .status(status)
                .build());
    }
}
