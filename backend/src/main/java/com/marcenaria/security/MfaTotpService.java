package com.marcenaria.security;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.stereotype.Service;

@Service
public class MfaTotpService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    /**
     * Gera uma nova chave secreta TOTP para o usuário
     */
    public String gerarNovoSegredo() {
        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    /**
     * Gera a URL otpauth:// para exibição do QR Code no frontend
     */
    public String gerarQrCodeUrl(String email, String secret) {
        GoogleAuthenticatorKey credentials = new GoogleAuthenticatorKey.Builder(secret).build();
        return GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL("Marcenaria ERP", email, credentials);
    }

    /**
     * Valida se o código de 6 dígitos inserido bate com o segredo do usuário
     */
    public boolean validarCodigo(String secret, int codigo) {
        if (secret == null || secret.isBlank()) {
            return false;
        }
        return gAuth.authorize(secret, codigo);
    }
}
