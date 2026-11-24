package com.gmu.smartcampus.repository;

import com.gmu.smartcampus.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByAadhaar(String aadhaar);
    Optional<UserAccount> findByEmailIgnoreCase(String email);
}
