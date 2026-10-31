package com.marcenaria.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.net.URI;

@Component
@Slf4j
public class BrowserLauncher {

    @Value("${app.open-browser:true}")
    private boolean openBrowser;

    @Value("${server.port:8085}")
    private int port;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!openBrowser) {
            return;
        }

        String url = "http://localhost:" + port;
        log.info("Abrindo o navegador automaticamente em: {}", url);

        new Thread(() -> {
            try {
                // Aguarda 1.2 segundos para garantir que o servidor HTTP está pronto para receber requisições
                Thread.sleep(1200);

                String os = System.getProperty("os.name").toLowerCase();
                if (os.contains("win")) {
                    new ProcessBuilder("cmd", "/c", "start", url).start();
                } else if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                    Desktop.getDesktop().browse(new URI(url));
                }
            } catch (Exception e) {
                log.warn("Não foi possível abrir o navegador automaticamente: {}", e.getMessage());
            }
        }).start();
    }
}
