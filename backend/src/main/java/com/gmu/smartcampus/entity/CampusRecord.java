package com.gmu.smartcampus.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="campus_records")
public class CampusRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String recordType;
    @Column(length=12000, nullable=false) private String payload;
    private Long ownerId;
    private Instant createdAt=Instant.now();
    public Long getId(){return id;} public String getRecordType(){return recordType;} public void setRecordType(String v){recordType=v;}
    public String getPayload(){return payload;} public void setPayload(String v){payload=v;}
    public Long getOwnerId(){return ownerId;} public void setOwnerId(Long v){ownerId=v;}
    public Instant getCreatedAt(){return createdAt;}
}
