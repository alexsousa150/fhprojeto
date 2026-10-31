package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, UUID> {
    Optional<Insumo> findByCodigo(String codigo);
}
