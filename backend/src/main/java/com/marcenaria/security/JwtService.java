package com.marcenaria.security;

import com.marcenaria.domain.entities.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs; // 15 minutos

    @Value("${security.jwt.mfa-ticket-expiration-ms:180000}")
    private long mfaTicketExpirationMs; // 3 minutos

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extrairUsername(String token) {
        return extrairClaim(token, Claims::getSubject);
    }

    public <T> T extrairClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extrairTodosClaims(token);
        return claimsResolver.apply(claims);
    }

    public String gerarAccessToken(Usuario usuario) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", usuario.getId().toString());
        extraClaims.put("cargo", usuario.getCargo().name());
        extraClaims.put("nome", usuario.getNome());
        extraClaims.put("tipoToken", "ACCESS");

        return construirToken(extraClaims, usuario.getUsername(), accessTokenExpirationMs);
    }

    /**
     * Ticket temporário de 3 minutos emitido quando o usuário precisa validar o 2FA
     */
    public String gerarMfaChallengeTicket(Usuario usuario) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", usuario.getId().toString());
        extraClaims.put("tipoToken", "MFA_CHALLENGE");

        return construirToken(extraClaims, usuario.getUsername(), mfaTicketExpirationMs);
    }

    private String construirToken(Map<String, Object> extraClaims, String subject, long expiracaoMs) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiracaoMs))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValido(String token, UserDetails userDetails) {
        final String username = extrairUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpirado(token);
    }

    public boolean isMfaChallengeValido(String ticket) {
        try {
            Claims claims = extrairTodosClaims(ticket);
            String tipo = claims.get("tipoToken", String.class);
            return "MFA_CHALLENGE".equals(tipo) && !isTokenExpirado(ticket);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpirado(String token) {
        return extrairExpiracao(token).before(new Date());
    }

    private Date extrairExpiracao(String token) {
        return extrairClaim(token, Claims::getExpiration);
    }

    private Claims extrairTodosClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
