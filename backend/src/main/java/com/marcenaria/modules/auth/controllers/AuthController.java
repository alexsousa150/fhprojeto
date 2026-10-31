package com.marcenaria.modules.auth.controllers;

import com.marcenaria.modules.auth.dto.*;
import com.marcenaria.modules.auth.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        return ResponseEntity.ok(authService.autenticar(request, httpRequest, httpResponse));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verificarMfa(
            @Valid @RequestBody MfaVerifyRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        return ResponseEntity.ok(authService.verificarMfa(request, httpRequest, httpResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> renovarSessao(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.renovarSessao(request, response));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> configurarMfa(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(authService.configurarMfa(userDetails.getUsername()));
    }

    @PostMapping("/mfa/activate")
    public ResponseEntity<Map<String, String>> ativarMfa(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Integer> payload
    ) {
        authService.ativarMfa(userDetails.getUsername(), payload.get("codigo"));
        return ResponseEntity.ok(Map.of("mensagem", "2FA ativado com sucesso em sua conta."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.deslogar(request, response);
        return ResponseEntity.ok(Map.of("mensagem", "Logout efetuado com sucesso."));
    }
}
