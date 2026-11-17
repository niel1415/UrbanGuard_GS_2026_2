package br.com.fiap.urbanguard.repository;
import br.com.fiap.urbanguard.domain.RiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {
    List<RiskEvent> findAllByOrderByPriorityScoreDescCreatedAtDesc();
}
