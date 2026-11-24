package com.gmu.smartcampus.repository;
import com.gmu.smartcampus.entity.CampusRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CampusRecordRepository extends JpaRepository<CampusRecord,Long> { List<CampusRecord> findByRecordType(String type); List<CampusRecord> findByRecordTypeAndOwnerId(String type,Long ownerId); }
