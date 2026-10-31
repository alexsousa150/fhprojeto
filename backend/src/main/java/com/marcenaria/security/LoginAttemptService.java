package com.marcenaria.security;

import com.marcenaria.domain.entities.Usuario;
import com.marcenaria.domain.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UsuarioRepository usuarioRepository;

    @Value("${security.brute-force.max-attempts:5}")
    private int maxTentativas;

    @Value("${security.brute-force.lockout-duration-minutes:15}")
    private int minutosBloqueio;

    @Transactional
    public void registrarSucesso(Usuario usuario) {
        if (usuario.getTentativasFalhas() > 0 || usuario.getBloqueadoAte() != null) {
            usuario.setTentativasFalhas(0);
            usuario.setBloqueadoAte(null);
        }
        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void registrarFalha(Usuario usuario) {
        int tentativas = usuario.getTentativasFalhas() + 1;
        usuario.setTentativasFalhas(tentativas);

        if (tentativas >= maxTentativas) {
            usuario.setBloqueadoAte(LocalDateTime.now().plusMinutes(minutosBloqueio));
        }

        usuarioRepository.save(usuario);
    }

    public boolean isBloqueado(Usuario usuario) {
        if (usuario.getBloqueadoAte() == null) {
            return false;
        }
        if (LocalDateTime.now().isAfter(usuario.getBloqueadoAte())) {
            return false; // Bloqueio expirou
        }
        return true;
    }
}
