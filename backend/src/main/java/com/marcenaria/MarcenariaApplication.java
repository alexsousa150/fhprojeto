package com.marcenaria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class MarcenariaApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(MarcenariaApplication.class, args);
        // Mantém a thread principal ativa para impedir o encerramento do launcher nativo GUI do Windows
        try {
            Thread.currentThread().join();
        } catch (InterruptedException ignored) {
        }
    }
}
