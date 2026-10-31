package com.marcenaria.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
@Slf4j
public class DatabaseDirectoryInitializer {

    static {
        try {
            File dataDir = new File("./data");
            if (!dataDir.exists()) {
                boolean created = dataDir.mkdirs();
                if (created) {
                    log.info("Diretório ./data criado com sucesso para o banco de dados.");
                }
            }
        } catch (Exception e) {
            log.warn("Aviso ao verificar diretório ./data: {}", e.getMessage());
        }
    }
}
