package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.ItemMovel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemMovelRepository extends JpaRepository<ItemMovel, UUID> {
}
