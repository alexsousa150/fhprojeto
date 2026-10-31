package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.Ambiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AmbienteRepository extends JpaRepository<Ambiente, UUID> {
}
