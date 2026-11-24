package com.gmu.smartcampus.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uk_users_aadhaar", columnNames = "username"),
    @UniqueConstraint(name = "uk_users_email", columnNames = "email")
})
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String fullName;
    @Column(name = "username", nullable = false, unique = true, length = 255) private String aadhaar;
    @Column(unique = true) private String email;
    private String mobile;
    private String department;
    private String semester;
    @Column(nullable = false) private String role;
    @Column(nullable = false) private String passwordHash;
    private boolean active = true;
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String value) { fullName = value; }
    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String value) { aadhaar = value; }
    public String getEmail() { return email; }
    public void setEmail(String value) { email = value; }
    public String getMobile() { return mobile; }
    public void setMobile(String value) { mobile = value; }
    public String getDepartment() { return department; }
    public void setDepartment(String value) { department = value; }
    public String getSemester() { return semester; }
    public void setSemester(String value) { semester = value; }
    public String getRole() { return role; }
    public void setRole(String value) { role = value; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String value) { passwordHash = value; }
    public boolean isActive() { return active; }
    public void setActive(boolean value) { active = value; }
    public Instant getCreatedAt() { return createdAt; }
}
