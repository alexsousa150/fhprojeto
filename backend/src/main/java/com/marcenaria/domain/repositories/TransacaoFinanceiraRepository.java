package com.marcenaria.domain.repositories;

import com.marcenaria.domain.entities.Projeto;
import com.marcenaria.domain.entities.TransacaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransacaoFinanceiraRepository extends JpaRepository<TransacaoFinanceira, UUID> {
    List<TransacaoFinanceira> findByProjeto(Projeto projeto);
}
