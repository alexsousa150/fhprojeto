package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.PecaCorte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PecaCorteRepository extends JpaRepository<PecaCorte, UUID> {
}
