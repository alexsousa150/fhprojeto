package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.OrdemProducao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrdemProducaoRepository extends JpaRepository<OrdemProducao, UUID> {
    Optional<OrdemProducao> findByCodigo(String codigo);
}
